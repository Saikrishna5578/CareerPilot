import os
import time
import logging
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from logger import log_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Note: We use the SERVICE_ROLE_KEY for the backend scraper to bypass RLS 
# and write globally cached job listings to the database.
supabase_client: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        log_event("ERROR", "SCRAPER", f"Failed to initialize Supabase client: {str(e)}")


async def fetch_jobs_from_adzuna(app_id: str, app_key: str, search_query: str, country: str = "in") -> List[Dict[str, Any]]:
    """
    Fetches job listings from the Adzuna public API (safe, robust, and no risk of IP bans).
    """
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": 10,
        "what": search_query,
        "content-type": "application/json"
    }
    
    log_event("INFO", "SCRAPER", f"Fetching jobs from Adzuna API for query: {search_query}...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                formatted_jobs = []
                for job in results:
                    formatted_jobs.append({
                        "title": job.get("title", "IT Role"),
                        "company": job.get("company", {}).get("display_name", "Technology Corp"),
                        "location": job.get("location", {}).get("display_name", "Remote"),
                        "description": job.get("description", ""),
                        "apply_link": job.get("redirect_url", ""),
                        "source": "adzuna",
                        "salary": f"{job.get('salary_min', '')} - {job.get('salary_max', '')}" if job.get("salary_min") else "Not disclosed",
                        "skills_required": job.get("category", {}).get("tag", "").split("_") or []
                    })
                return formatted_jobs
            else:
                log_event("ERROR", "SCRAPER", f"Adzuna API responded with status: {response.status_code}")
                return []
        except Exception as e:
            log_event("ERROR", "SCRAPER", f"Error calling Adzuna API: {str(e)}")
            return []


async def scrape_custom_html_board(url: str) -> List[Dict[str, Any]]:
    """
    Demonstrates a BeautifulSoup scraper parsing a custom local/unprotected HTML job feed.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    logger.info(f"Scraping custom job board: {url}...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code != 200:
                logger.error(f"Failed to fetch job board: {response.status_code}")
                return []
                
            soup = BeautifulSoup(response.text, "html.parser")
            jobs = []
            
            # This is a sample CSS selector structure. Change based on your target site.
            job_cards = soup.select(".job-card, .posting")
            for card in job_cards:
                title_elem = card.select_one(".job-title, h2")
                company_elem = card.select_one(".company-name, .company")
                link_elem = card.select_one("a[href]")
                location_elem = card.select_one(".location")
                
                if title_elem and company_elem and link_elem:
                    jobs.append({
                        "title": title_elem.text.strip(),
                        "company": company_elem.text.strip(),
                        "location": location_elem.text.strip() if location_elem else "Remote",
                        "description": "Click apply link to read full job description.",
                        "apply_link": link_elem["href"],
                        "source": "custom_scraper",
                        "salary": "Not disclosed",
                        "skills_required": []
                    })
            return jobs
        except Exception as e:
            logger.error(f"Error scraping HTML: {str(e)}")
            return []


async def run_scraper_and_sync(search_query: str = "internship"):
    """
    Main job scraper orchestrator. Scrapes listings and upserts them to Supabase.
    """
    if not supabase_client:
        log_event("WARNING", "SCRAPER", "Supabase client not initialized. Cannot save scraped jobs.")
        return
        
    # Attempt to use Adzuna API if keys are provided
    adzuna_app_id = os.getenv("ADZUNA_APP_ID")
    adzuna_app_key = os.getenv("ADZUNA_APP_KEY")
    
    jobs = []
    if adzuna_app_id and adzuna_app_key:
        jobs = await fetch_jobs_from_adzuna(adzuna_app_id, adzuna_app_key, search_query=search_query)
    
    # If no API results, log warning
    if not jobs:
        log_event("WARNING", "SCRAPER", f"No live job opportunities found for query: {search_query}")

    # Batch upsert to database using Supabase
    success_count = 0
    for job in jobs:
        try:
            # We use upsert, matching on the unique apply_link constraint
            data, count = supabase_client.table("job_listings").upsert(
                job, 
                on_conflict="apply_link"
            ).execute()
            success_count += 1
        except Exception as e:
            log_event("ERROR", "SCRAPER", f"Failed to upsert job {job['title']} at {job['company']}: {str(e)}")
            
    log_event("INFO", "SCRAPER", f"Scraper run finished. Successfully synced {success_count} job listings.", {"count": success_count})


if __name__ == "__main__":
    # Test script execution
    import asyncio
    from dotenv import load_dotenv
    load_dotenv()
    
    asyncio.run(run_scraper_and_sync())

import os
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

# Import local services
from roadmap_gen import generate_learning_roadmap
from scraper import run_scraper_and_sync
from logger import log_event

# Load environmental variables
load_dotenv()

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CareerPilot & Learn API Gateway",
    description="Python FastAPI backend powering AI Roadmap Generation, Job Scraping, and Background Reminders.",
    version="1.0.0"
)

# Enable CORS for local React and React Native web builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*" # Replace with your actual deployment URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Hit Counters In-Memory Cache
api_hit_counters = {}

# Background task to sync hits to database asynchronously (non-blocking)
async def sync_hit_to_db(endpoint_key: str):
    if not supabase_client:
        return
    try:
        import asyncio
        method, path = endpoint_key.split(" ", 1)
        # Fetch current hit count
        res = supabase_client.table("api_hits").select("hit_count").eq("endpoint", path).eq("method", method).execute()
        current_count = 0
        if res.data:
            current_count = res.data[0]["hit_count"]
        
        supabase_client.table("api_hits").upsert({
            "endpoint": path,
            "method": method,
            "hit_count": current_count + 1,
            "updated_at": "now()"
        }).execute()
    except Exception as e:
        logger.error(f"Failed to sync API hit to database: {str(e)}")

@app.middleware("http")
async def track_api_hits(request: Request, call_next):
    path = request.url.path
    method = request.method
    
    # Track paths starting with /api
    if path.startswith("/api"):
        key = f"{method} {path}"
        api_hit_counters[key] = api_hit_counters.get(key, 0) + 1
        
        # Async background sync without blocking client response
        import asyncio
        asyncio.create_task(sync_hit_to_db(key))
        
    response = await call_next(request)
    return response

# Initialize Supabase Admin/Client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase_client: Optional[Client] = None

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the JWT token from the Authorization header against Supabase.
    """
    token = credentials.credentials
    if not supabase_client:
        return {"id": "offline-user", "email": "offline@careerpilot.com"}
    try:
        user_res = supabase_client.auth.get_user(token)
        if user_res and user_res.user:
            return user_res.user
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        log_event("INFO", "API_GATEWAY", "Successfully connected to Supabase Database.")
    except Exception as e:
        log_event("ERROR", "API_GATEWAY", f"Error initializing Supabase: {str(e)}")
else:
    log_event("WARNING", "API_GATEWAY", "Supabase environment variables missing. Server starting in offline fallback mode.")


# ==========================================
# Pydantic Schemas
# ==========================================
class UserProfileInput(BaseModel):
    user_id: str
    full_name: str
    career_goal: str
    language: str
    interests: str

class TriggerScraperRequest(BaseModel):
    skills: str
    domain: str
    experience: str
    work_mode: str

class JobApplicationInput(BaseModel):
    user_id: str
    title: str
    company: str
    stage: str
    location: Optional[str] = "Remote"
    salary: Optional[str] = "Not disclosed"
    apply_link: Optional[str] = ""
    is_fav: bool = False

class JobApplicationUpdateInput(BaseModel):
    user_id: str
    title: str
    company: str
    stage: str
    location: Optional[str] = "Remote"
    salary: Optional[str] = "Not disclosed"
    apply_link: Optional[str] = ""
    is_fav: bool = False


# ==========================================
# Endpoints
# ==========================================

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "CareerPilot Backend API"}


@app.get("/api/jobs")
def get_jobs(query: Optional[str] = None, user: dict = Depends(verify_token)):
    """
    Returns job listings. Fetches from Supabase if connected,
    otherwise returns a mock list of jobs.
    Supports filtering by custom search query.
    """
    jobs = []
    if supabase_client:
        try:
            res = supabase_client.table("job_listings").select("*").order("posted_at", desc=True).execute()
            log_event("INFO", "API_GATEWAY", "Fetched job listings from Supabase.")
            jobs = res.data or []
        except Exception as e:
            log_event("ERROR", "API_GATEWAY", f"Error fetching jobs from Supabase: {str(e)}")
            jobs = []
            
    # Post-filtering by search keywords if query is provided
    if query and jobs:
        keywords = [kw.lower().strip() for kw in query.split() if kw.strip()]
        filtered_jobs = []
        for job in jobs:
            title = (job.get("title") or "").lower()
            company = (job.get("company") or "").lower()
            location = (job.get("location") or "").lower()
            
            # Map skills list to string for matching
            skills_list = job.get("skills_required") or []
            if isinstance(skills_list, list):
                skills = " ".join([str(s).lower() for s in skills_list])
            else:
                skills = str(skills_list).lower()
                
            # Match if any keyword matches
            match_count = 0
            for kw in keywords:
                if kw in title or kw in company or kw in location or kw in skills:
                    match_count += 1
            
            if len(keywords) == 0 or match_count > 0:
                filtered_jobs.append(job)
        return filtered_jobs
        
    return jobs


@app.post("/api/roadmap/generate")
async def generate_user_roadmap(profile_data: UserProfileInput, user: dict = Depends(verify_token)):
    """
    Triggers Gemini AI to create a tailored learning roadmap based on user goal, language, and interests,
    registers it under their profile, and inserts individual weeks into roadmap_items.
    """
    if not supabase_client:
        try:
            logger.info("Supabase client offline. Generating offline roadmap...")
            ai_roadmap = generate_learning_roadmap(profile_data.career_goal, profile_data.language, profile_data.interests)
            return {
                "message": "Roadmap generated in offline fallback mode.",
                "roadmap_title": ai_roadmap.get("roadmap_title", "Custom IT Roadmap"),
                "weeks": ai_roadmap.get("weeks", []),
                "details": {
                    "milestone_projects": ai_roadmap.get("milestone_projects", ""),
                    "final_project": ai_roadmap.get("final_project", ""),
                    "portfolio_roadmap": ai_roadmap.get("portfolio_roadmap", ""),
                    "interview_prep": ai_roadmap.get("interview_prep", ""),
                    "weekly_plan": ai_roadmap.get("weekly_plan", ""),
                    "daily_plan": ai_roadmap.get("daily_plan", ""),
                    "next_skills": ai_roadmap.get("next_skills", "")
                }
            }
        except Exception as e:
            logger.error(f"Error generating offline roadmap: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    try:
        # 1. Update/Upsert the user's profile with their language & interests mapped to current_skills
        skills_list = [profile_data.language] + [i.strip() for i in profile_data.interests.split(",") if i.strip()]
        profile_upsert = {
            "id": profile_data.user_id,
            "full_name": profile_data.full_name,
            "current_skills": skills_list,
            "target_roles": [profile_data.career_goal],
            "updated_at": "now()"
        }
        supabase_client.table("profiles").upsert(profile_upsert).execute()

        # 2. Call the generator service
        log_event("INFO", "ROADMAP_GEN", f"Generating learning roadmap for user: {profile_data.user_id}", {"goal": profile_data.career_goal, "lang": profile_data.language})
        ai_roadmap = generate_learning_roadmap(profile_data.career_goal, profile_data.language, profile_data.interests)
        
        # Delete old roadmaps for this user to ensure no old records or duplicates remain
        try:
            supabase_client.table("roadmaps").delete().eq("user_id", profile_data.user_id).execute()
        except Exception as delete_err:
            log_event("WARNING", "ROADMAP_GEN", f"Error clearing old roadmaps: {str(delete_err)}")
            
        # 3. Create active roadmap record in DB
        roadmap_record = {
            "user_id": profile_data.user_id,
            "title": ai_roadmap.get("roadmap_title", "Custom IT Roadmap"),
            "is_active": True,
            "details": {
                "milestone_projects": ai_roadmap.get("milestone_projects", ""),
                "final_project": ai_roadmap.get("final_project", ""),
                "portfolio_roadmap": ai_roadmap.get("portfolio_roadmap", ""),
                "interview_prep": ai_roadmap.get("interview_prep", ""),
                "weekly_plan": ai_roadmap.get("weekly_plan", ""),
                "daily_plan": ai_roadmap.get("daily_plan", ""),
                "next_skills": ai_roadmap.get("next_skills", "")
            }
        }
        
        try:
            roadmap_res = supabase_client.table("roadmaps").insert(roadmap_record).execute()
        except Exception as insert_err:
            log_event("WARNING", "ROADMAP_GEN", f"Failed to insert details column, trying without details: {str(insert_err)}")
            roadmap_record.pop("details", None)
            roadmap_res = supabase_client.table("roadmaps").insert(roadmap_record).execute()

        roadmap_id = roadmap_res.data[0]["id"]

        # 4. Insert week cards into roadmap_items
        roadmap_items = []
        for week in ai_roadmap.get("weeks", []):
            roadmap_items.append({
                "roadmap_id": roadmap_id,
                "week_number": week.get("week_number"),
                "topic_name": week.get("topic_name"),
                "description": week.get("description"),
                "resources": week.get("resources"),
                "status": "Pending"
            })
            
        supabase_client.table("roadmap_items").insert(roadmap_items).execute()
        log_event("INFO", "ROADMAP_GEN", f"Successfully generated and stored {len(roadmap_items)} weeks for roadmap {roadmap_id}", {"roadmap_id": roadmap_id, "user_id": profile_data.user_id})

        return {
            "message": "Roadmap generated and synced successfully.",
            "roadmap_id": roadmap_id,
            "roadmap_title": ai_roadmap.get("roadmap_title"),
            "weeks": ai_roadmap.get("weeks", []),
            "details": {
                "milestone_projects": ai_roadmap.get("milestone_projects", ""),
                "final_project": ai_roadmap.get("final_project", ""),
                "portfolio_roadmap": ai_roadmap.get("portfolio_roadmap", ""),
                "interview_prep": ai_roadmap.get("interview_prep", ""),
                "weekly_plan": ai_roadmap.get("weekly_plan", ""),
                "daily_plan": ai_roadmap.get("daily_plan", ""),
                "next_skills": ai_roadmap.get("next_skills", "")
            }
        }

    except Exception as e:
        log_event("ERROR", "ROADMAP_GEN", f"Error executing roadmap generator endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


class FrontendLogInput(BaseModel):
    severity: str
    service: str
    message: str
    payload: Optional[dict] = None

@app.post("/api/logs")
def post_frontend_log(log_input: FrontendLogInput, user: dict = Depends(verify_token)):
    """
    Allows the frontend to POST errors or messages to the central database logging table.
    """
    log_event(
        severity=log_input.severity,
        service=f"FRONTEND:{log_input.service}",
        message=log_input.message,
        payload=log_input.payload
    )
    return {"status": "logged"}


@app.post("/api/scraper/trigger")
async def trigger_job_scraper(request_data: TriggerScraperRequest, user: dict = Depends(verify_token)):
    """
    Runs the scraper synchronously to query job listings matching user's specific preferences,
    writes them to 'job_listings' table in the database, tags them as new/old, and returns them.
    """
    query = f"{request_data.domain} {request_data.skills} {request_data.experience}"
    if request_data.work_mode != "Any":
        query += f" {request_data.work_mode}"
        
    log_event("INFO", "SCRAPER", f"Scraper manual trigger received for query: '{query}'.")
    
    adzuna_app_id = os.getenv("ADZUNA_APP_ID")
    adzuna_app_key = os.getenv("ADZUNA_APP_KEY")
    
    # 1. Fetch fresh jobs from Adzuna
    scraped_jobs = []
    if adzuna_app_id and adzuna_app_key:
        try:
            from scraper import fetch_jobs_from_adzuna
            scraped_jobs = await fetch_jobs_from_adzuna(adzuna_app_id, adzuna_app_key, search_query=query)
        except Exception as e:
            log_event("ERROR", "SCRAPER", f"Error in trigger_job_scraper fetching Adzuna: {str(e)}")
            scraped_jobs = []
            
    # 2. Write fresh jobs to job_listings database table
    if supabase_client and scraped_jobs:
        for job in scraped_jobs:
            try:
                supabase_client.table("job_listings").upsert(
                    job, 
                    on_conflict="apply_link"
                ).execute()
            except Exception as e:
                log_event("WARNING", "SCRAPER", f"Failed to upsert job {job.get('title')} to job_listings: {str(e)}")

    # 3. Retrieve all job listings from DB to merge old results
    all_jobs = []
    if supabase_client:
        try:
            res = supabase_client.table("job_listings").select("*").order("posted_at", desc=True).execute()
            all_jobs = res.data or []
        except Exception as e:
            log_event("ERROR", "API_GATEWAY", f"Error fetching jobs from job_listings: {str(e)}")
            all_jobs = []
    else:
        all_jobs = scraped_jobs

    # 4. Filter by query keywords and tag as new or old
    keywords = [kw.lower().strip() for kw in query.split() if kw.strip()]
    filtered_jobs = []
    scraped_links = {job.get("apply_link") for job in scraped_jobs if job.get("apply_link")}
    
    for job in all_jobs:
        title = (job.get("title") or "").lower()
        company = (job.get("company") or "").lower()
        location = (job.get("location") or "").lower()
        
        skills_list = job.get("skills_required") or []
        if isinstance(skills_list, list):
            skills = " ".join([str(s).lower() for s in skills_list])
        else:
            skills = str(skills_list).lower()
            
        match_count = 0
        for kw in keywords:
            if kw in title or kw in company or kw in location or kw in skills:
                match_count += 1
                
        if len(keywords) == 0 or match_count > 0:
            # Tag whether it was returned in the active scraper pull
            job["is_new"] = job.get("apply_link") in scraped_links
            filtered_jobs.append(job)
            
    return {"jobs": filtered_jobs}


@app.get("/api/applications")
def get_user_applications(user_id: str, user: dict = Depends(verify_token)):
    """
    Retrieves all job applications for a specific user, parses notes JSON, and returns them.
    """
    if not supabase_client:
        return []
    try:
        res = supabase_client.table("job_applications")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("order_index")\
            .execute()
        
        apps = res.data or []
        parsed_apps = []
        for app in apps:
            notes_str = app.get("notes") or ""
            location = "Remote"
            salary = "Not disclosed"
            apply_link = ""
            is_fav = False
            
            try:
                import json
                meta = json.loads(notes_str)
                location = meta.get("location", "Remote")
                salary = meta.get("salary", "Not disclosed")
                apply_link = meta.get("apply_link", "")
                is_fav = meta.get("is_fav", False)
            except Exception:
                is_fav = notes_str == "fav"
                
            parsed_apps.append({
                "id": app.get("id"),
                "user_id": app.get("user_id"),
                "title": app.get("title"),
                "company": app.get("company"),
                "stage": "Favorite" if is_fav else app.get("stage"),
                "notes": notes_str,
                "location": location,
                "salary": salary,
                "apply_link": apply_link,
                "is_fav": is_fav,
                "order_index": app.get("order_index", 0),
                "applied_date": app.get("applied_date")
            })
        return parsed_apps
    except Exception as e:
        log_event("ERROR", "API_GATEWAY", f"Failed to retrieve user applications: {str(e)}")
        return []

@app.post("/api/applications")
def create_job_application(payload: JobApplicationInput, user: dict = Depends(verify_token)):
    """
    Creates a new job application under job_applications table.
    """
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
        
    import json
    notes_payload = json.dumps({
        "is_fav": payload.is_fav,
        "location": payload.location,
        "salary": payload.salary,
        "apply_link": payload.apply_link,
        "user_notes": ""
    })
    
    try:
        res = supabase_client.table("job_applications").insert({
            "user_id": payload.user_id,
            "title": payload.title,
            "company": payload.company,
            "stage": "Applied" if payload.is_fav else payload.stage,
            "notes": notes_payload
        }).execute()
        
        if res.data:
            app = res.data[0]
            return {
                "id": app.get("id"),
                "user_id": app.get("user_id"),
                "title": app.get("title"),
                "company": app.get("company"),
                "stage": "Favorite" if payload.is_fav else app.get("stage"),
                "notes": notes_payload,
                "location": payload.location,
                "salary": payload.salary,
                "apply_link": payload.apply_link,
                "is_fav": payload.is_fav,
                "order_index": app.get("order_index", 0),
                "applied_date": app.get("applied_date")
            }
        raise HTTPException(status_code=500, detail="Database insertion failed.")
    except Exception as e:
        log_event("ERROR", "API_GATEWAY", f"Failed to create job application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/applications/{app_id}")
def update_job_application(app_id: str, payload: JobApplicationUpdateInput, user: dict = Depends(verify_token)):
    """
    Updates an existing job application.
    """
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
        
    import json
    notes_payload = json.dumps({
        "is_fav": payload.is_fav,
        "location": payload.location,
        "salary": payload.salary,
        "apply_link": payload.apply_link,
        "user_notes": ""
    })
    
    try:
        res = supabase_client.table("job_applications").update({
            "title": payload.title,
            "company": payload.company,
            "stage": "Applied" if payload.is_fav else payload.stage,
            "notes": notes_payload,
            "updated_at": "now()"
        }).eq("id", app_id).eq("user_id", payload.user_id).execute()
        
        return {"status": "success", "data": res.data}
    except Exception as e:
        log_event("ERROR", "API_GATEWAY", f"Failed to update job application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/applications/{app_id}")
def delete_job_application(app_id: str, user_id: str, user: dict = Depends(verify_token)):
    """
    Deletes a job application.
    """
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")
    try:
        res = supabase_client.table("job_applications").delete().eq("id", app_id).eq("user_id", user_id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        log_event("ERROR", "API_GATEWAY", f"Failed to delete job application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/remind-4h")
async def check_and_send_reminders(x_cron_token: Optional[str] = Header(None)):
    cron_secret = os.getenv("CRON_SECRET", "default_cron_secret")
    if x_cron_token != cron_secret:
        raise HTTPException(status_code=403, detail="Unauthorized cron request")
    """
    Utility task that checks users' active learning progress.
    Can be run by an external scheduler (like cron or AWS EventBridge) every 4 hours.
    Sends push notification payload to FCM/Expo API if the user has pending targets.
    """
    if not supabase_client:
         raise HTTPException(status_code=503, detail="Supabase not configured.")
         
    try:
        # Fetch profiles and check if there are pending roadmap items for the current active roadmaps
        query = supabase_client.table("roadmap_items")\
            .select("roadmap_id, status, roadmaps(user_id)")\
            .eq("status", "Pending")\
            .execute()
            
        pending_items = query.data
        if not pending_items:
            log_event("INFO", "NOTIFICATIONS", "Notification scheduler: No pending learning items. All users on track!")
            return {"message": "All users are caught up. No notifications sent."}

        # Log simulated push notifications
        users_notified = set()
        for item in pending_items:
            user_id = item.get("roadmaps", {}).get("user_id")
            if user_id and user_id not in users_notified:
                users_notified.add(user_id)
                # In production, dispatch Firebase Cloud Messaging request:
                # payload = {"to": user_device_token, "notification": {"title": "Keep it up!", "body": "You have weekly learning goals pending today."}}
                log_event("INFO", "NOTIFICATIONS", f"Push notification sent: Triggering 4-hour reminder for user {user_id}", {"user_id": user_id})

        return {
            "status": "success",
            "notified_users_count": len(users_notified),
            "details": f"Dispatched reminders to {len(users_notified)} students."
        }
    except Exception as e:
        log_event("ERROR", "NOTIFICATIONS", f"Failed to process reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# APScheduler: Cron task configuration
# ==========================================
# (Optional) You can start APScheduler directly inside the event loop for local running
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio

scheduler = BackgroundScheduler()

def scheduled_scraper_run():
    logger.info("Executing scheduled background scraping job...")
    asyncio.run(run_scraper_and_sync())

# Run scraper every 12 hours automatically
scheduler.add_job(scheduled_scraper_run, 'interval', hours=12)

@app.on_event("startup")
def start_scheduler():
    logger.info("Starting background event schedulers...")
    scheduler.start()

@app.on_event("shutdown")
def stop_scheduler():
    logger.info("Stopping background event schedulers...")
    scheduler.shutdown()


# ==========================================
# Admin Control Panel & Stats
# ==========================================
class FeatureFlagInput(BaseModel):
    key: str
    enabled: bool

# In-memory feature flags fallback
mock_feature_flags = {
    "roadmap_gen": {"name": "AI Roadmap Creator", "description": "Allows users to generate AI roadmaps using Gemini.", "enabled": True},
    "scraper": {"name": "Automated Job Scraper", "description": "Enables scraping and manual job sync buttons.", "enabled": True},
    "resume_upload": {"name": "Master Resume Upload", "description": "Allows users to upload their PDF resume.", "enabled": True},
    "guest_lock": {"name": "Enforce Guest Mode Locks", "description": "If disabled, guest users get free access to all locked features.", "enabled": True}
}

@app.get("/api/admin/stats")
def get_admin_stats(user: dict = Depends(verify_token)):
    """
    Gathers metrics and API hits statistics.
    """
    stats = {
        "total_users": 0,
        "total_roadmaps": 0,
        "total_jobs": 0,
        "gemini_requests": 0,
        "api_hits": []
    }
    
    # 1. Populate API hits from memory first
    memory_hits = []
    for key, count in api_hit_counters.items():
        method, path = key.split(" ", 1)
        memory_hits.append({
            "endpoint": path,
            "method": method,
            "hit_count": count
        })
        
    if not supabase_client:
        stats["gemini_requests"] = api_hit_counters.get("POST /api/roadmap/generate", 0)
        stats["api_hits"] = memory_hits
        stats["total_users"] = 2
        stats["total_roadmaps"] = 3
        stats["total_jobs"] = len(get_jobs())
        return stats

    try:
        # DB Query counts
        res_users = supabase_client.table("profiles").select("id", count="exact").execute()
        stats["total_users"] = res_users.count if res_users.count is not None else 0
        
        res_rm = supabase_client.table("roadmaps").select("id", count="exact").execute()
        stats["total_roadmaps"] = res_rm.count if res_rm.count is not None else 0
        
        res_jobs = supabase_client.table("job_listings").select("id", count="exact").execute()
        stats["total_jobs"] = res_jobs.count if res_jobs.count is not None else 0
        
        res_logs = supabase_client.table("system_logs").select("id", count="exact").eq("service", "ROADMAP_GEN").like("message", "%Requesting roadmap%").execute()
        stats["gemini_requests"] = res_logs.count if res_logs.count is not None else 0
        
        # Load persistent DB api hits
        res_hits = supabase_client.table("api_hits").select("*").order("hit_count", desc=True).execute()
        stats["api_hits"] = res_hits.data or []
        
    except Exception as e:
        logger.error(f"Error executing admin stats fetch: {str(e)}")
        stats["gemini_requests"] = api_hit_counters.get("POST /api/roadmap/generate", 0)
        stats["api_hits"] = memory_hits
        
    return stats

@app.get("/api/admin/features")
def get_feature_flags(user: dict = Depends(verify_token)):
    if not supabase_client:
        return [
            {"key": k, "name": v["name"], "description": v["description"], "enabled": v["enabled"]}
            for k, v in mock_feature_flags.items()
        ]
    try:
        res = supabase_client.table("feature_flags").select("*").execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching feature flags: {str(e)}")
        return [
            {"key": k, "name": v["name"], "description": v["description"], "enabled": v["enabled"]}
            for k, v in mock_feature_flags.items()
        ]

@app.post("/api/admin/features")
def update_feature_flag(flag_input: FeatureFlagInput, user: dict = Depends(verify_token)):
    if not supabase_client:
        if flag_input.key in mock_feature_flags:
            mock_feature_flags[flag_input.key]["enabled"] = flag_input.enabled
            return {"status": "success", "message": f"Updated {flag_input.key} flag locally."}
        raise HTTPException(status_code=404, detail="Feature flag not found.")
    try:
        res = supabase_client.table("feature_flags")\
            .update({"enabled": flag_input.enabled, "updated_at": "now()"}) \
            .eq("key", flag_input.key) \
            .execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        logger.error(f"Error updating feature flag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # Start ASGI server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

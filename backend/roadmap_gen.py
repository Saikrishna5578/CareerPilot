import os
import json
import logging
from typing import List, Dict, Optional
from google import genai
from pydantic import BaseModel, Field

from logger import log_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define Pydantic Schema for structured LLM response
class RoadmapItem(BaseModel):
    week_number: int = Field(description="The week number, starting at 1")
    topic_name: str = Field(description="Title of the topic for this week")
    description: str = Field(
        description="Thorough content in clean Markdown containing: Why learn it, Prerequisites, Objectives, "
                    "Beginner-friendly Explanation (5th-grade level), Analogy, Exercises, Assignment, Mini Quiz, "
                    "Common Mistakes, Debugging Tips, Interview Questions, and Estimated study time."
    )
    resources: List[str] = Field(
        description="List of 3 exact FREE resource URLs/titles: 1 YouTube Playlist, 1 Official Doc, 1 Website Article"
    )

class FullRoadmap(BaseModel):
    roadmap_title: str = Field(description="Title of the learning roadmap")
    weeks: List[RoadmapItem] = Field(description="List of roadmap items, week by week")
    milestone_projects: str = Field(description="Milestone project, skills acquired, portfolio value, and revision checklist in clean Markdown")
    final_project: str = Field(description="Final industry-level project details (features, tech stack, resume value) in clean Markdown")
    portfolio_roadmap: str = Field(description="Portfolio roadmap (beginner, intermediate, advanced, open-source ideas) in clean Markdown")
    interview_prep: str = Field(description="Interview preparation guide (core topics, coding platforms, mock resources, resume/github tips) in clean Markdown")
    weekly_plan: str = Field(description="Weekly schedule based on available time in clean Markdown")
    daily_plan: str = Field(description="Daily routine (learning, coding, revision, breaks) in clean Markdown")
    next_skills: str = Field(description="Recommended next skills after completing this roadmap in clean Markdown")

def generate_learning_roadmap(career_goal: str, language: str, interests: str) -> Dict:
    """
    Generates a complete detailed MentorAI learning roadmap based on a student profile
    using the Google Gemini API.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        log_event("WARNING", "ROADMAP_GEN", "GEMINI_API_KEY environment variable is missing. Falling back to dummy roadmap generator.")
        return generate_mock_roadmap(career_goal, language, interests)

    try:
        # Initialize the Google GenAI client
        client = genai.Client(api_key=api_key)
        
        # Define raw OpenAPI Schema dict to enforce structured JSON output on the server
        openapi_schema = {
            "type": "OBJECT",
            "properties": {
                "roadmap_title": {"type": "STRING", "description": "Title of the learning roadmap"},
                "weeks": {
                    "type": "ARRAY",
                    "description": "List of roadmap items, week by week",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "week_number": {"type": "INTEGER", "description": "The week number, starting at 1"},
                            "topic_name": {"type": "STRING", "description": "Title of the topic for this week"},
                            "description": {"type": "STRING", "description": "Thorough content in Markdown: Why learn, Prerequisites, Objectives, Explanation, Analogy, Exercises, Assignment, Mini Quiz, Common mistakes, Debugging, Interview questions"},
                            "resources": {
                                "type": "ARRAY",
                                "items": {"type": "STRING"},
                                "description": "List of 3 exact free resource URLs or titles"
                            }
                        },
                        "required": ["week_number", "topic_name", "description", "resources"]
                    }
                },
                "milestone_projects": {"type": "STRING", "description": "Milestone project details in Markdown"},
                "final_project": {"type": "STRING", "description": "Final project details in Markdown"},
                "portfolio_roadmap": {"type": "STRING", "description": "Portfolio project ideas in Markdown"},
                "interview_prep": {"type": "STRING", "description": "Interview prep guide in Markdown"},
                "weekly_plan": {"type": "STRING", "description": "Weekly study schedule in Markdown"},
                "daily_plan": {"type": "STRING", "description": "Daily routine details in Markdown"},
                "next_skills": {"type": "STRING", "description": "Recommended next skills in Markdown"}
            },
            "required": [
                "roadmap_title", "weeks", "milestone_projects", "final_project", 
                "portfolio_roadmap", "interview_prep", "weekly_plan", "daily_plan", "next_skills"
            ]
        }

        prompt = f"""
        You are MentorAI, an expert Curriculum Designer, Senior Software Engineer, Technical Interviewer, Career Coach, and Learning Psychologist.
        
        Generate a complete personalized learning roadmap for this student profile:
        - Career Goal: {career_goal}
        - Preferred Programming Language: {language}
        - Interests: {interests}
        
        Rules:
        1. Let the curriculum span as many weeks as needed to master the skill from zero to industry-ready.
        2. Keep weekly descriptions concise, engaging, and high-yield.
        3. Inside the weekly "description" field, include ONLY:
           - A brief overview of the week's topic.
           - A compelling real-world example of where this topic/concept is used in a real product (e.g. Spotify, Instagram, Netflix, Uber, YouTube) to excite the student.
           - DO NOT include assignments, quizzes, study routines, debugging tips, or common mistakes here.
        4. In the "resources" field, provide exactly 3 high-quality free resource URLs.
        5. Simplify all supplementary top-level sections to keep the token size compact:
           - "milestone_projects" & "final_project": Just a short project idea or a practical problem statement.
           - "weekly_plan" & "daily_plan": Keep it to 1-2 sentences of high-level tips.
           - "portfolio_roadmap", "interview_prep" & "next_skills": Actionable bulleted lists with no filler text.
        """
        
        log_event("INFO", "ROADMAP_GEN", f"Requesting roadmap from Gemini API for {career_goal}...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": openapi_schema
            }
        )
        logger.info(f'Prompt to GEMINI: {prompt}')
        logger.info(f'Response from GEMINI: {response}')
        roadmap_data = json.loads(response.text)
        return roadmap_data
        
    except Exception as e:
        log_event("ERROR", "ROADMAP_GEN", f"Error calling Gemini API: {str(e)}. Falling back to mock data.")
        return generate_mock_roadmap(career_goal, language, interests)

def generate_mock_roadmap(career_goal: str, language: str, interests: str) -> Dict:
    """
    Returns a friendly user-facing fallback roadmap when the API call fails or is unavailable.
    """
    log_event("WARNING", "ROADMAP_GEN", "Returning user-facing service unavailable roadmap fallback.")
    return {
        "roadmap_title": "AI Mentor Temporarily Busy",
        "weeks": [
            {
                "week_number": 1,
                "topic_name": "AI Generation Queue Busy",
                "description": "Our AI Career Mentor is currently experiencing a high volume of requests or is temporarily unavailable. Please try generating your roadmap again in a few moments.",
                "resources": [
                    "Try again in 1-2 minutes",
                    "Check your internet connection"
                ]
            }
        ],
        "milestone_projects": "Service temporarily busy.",
        "final_project": "Service temporarily busy.",
        "portfolio_roadmap": "Service temporarily busy.",
        "interview_prep": "Service temporarily busy.",
        "weekly_plan": "Service temporarily busy.",
        "daily_plan": "Service temporarily busy.",
        "next_skills": "Service temporarily busy."
    }

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
        
        prompt = f"""
        You are MentorAI, an expert Curriculum Designer, Senior Software Engineer, Technical Interviewer, Career Coach, and Learning Psychologist.
        
        Generate a complete personalized learning roadmap for this student profile:
        - Career Goal: {career_goal}
        - Preferred Programming Language: {language}
        - Interests: {interests}
        
        Rules:
        - Assume the student has ZERO knowledge.
        - Explain every concept using very simple English that a 5th-grade student can understand.
        - Use real-life analogies wherever possible.
        - Build the roadmap from beginner to industry-ready.
        - Arrange topics strictly in prerequisite order.
        - Never skip any important fundamentals.
        - Recommend ONLY FREE, high-quality, and up-to-date resources. Prefer official documentation where appropriate.
        - Recommend the best YouTube playlists, websites, interactive courses, blogs, GitHub repositories, and practice platforms.
        - Use project-based learning. Add projects after every milestone.
        - Mention if a topic does not require coding practice platforms like LeetCode and recommend better alternatives.
        
        For each week, fill the "description" field with a thorough and beautifully structured markdown containing:
        - Why learn it
        - Prerequisites
        - Learning Objectives
        - Beginner-friendly Explanation
        - Real-life Analogy
        - Exercises
        - Assignment
        - Mini Quiz
        - Common Beginner Mistakes & Debugging Tips
        - Typical Interview Questions
        - Estimated Learning Time (e.g. "6 hours")
        - Ready-to-Move Checklist
        
        Provide high-yield resource details in the "resources" field.
        
        In the top-level fields of the JSON schema, generate detailed Markdown text for the following sections:
        - milestone_projects: Milestone Project, Skills Acquired, Portfolio Value, and Revision Checklist.
        - final_project: Features, Tech Stack, Learning Outcomes, and Resume Value.
        - portfolio_roadmap: Suggest Beginner, Intermediate, Advanced Projects, and Open Source Contribution Ideas.
        - interview_prep: Core Interview Topics, Coding Practice Platforms, Mock Interview Resources, Resume & GitHub Tips.
        - weekly_plan: Generate a realistic week-by-week study schedule.
        - daily_plan: Generate a daily routine (Learning, Coding, Revision, Project Work, Breaks).
        - next_skills: Recommend next skills and explain why they should be learned.
        """
        
        log_event("INFO", "ROADMAP_GEN", f"Requesting roadmap from Gemini API for {career_goal}...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": FullRoadmap
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

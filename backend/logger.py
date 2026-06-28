import os
import json
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Ensure logs directory exists
LOGS_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOGS_DIR, "app.log")

# Setup standard logging
logger = logging.getLogger("CareerPilotBackend")
logger.setLevel(logging.INFO)

# Formatter
formatter = logging.Formatter("[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s")

# Console Handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# File Handler (rotating log, max 5MB, keep 3 backups)
file_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=5 * 1024 * 1024, backupCount=3)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Initialize Supabase client for DB logging
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

db_client = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        db_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Database logger connected to Supabase.")
    except Exception as e:
        logger.error(f"Failed to initialize Database logger client: {str(e)}")


def log_event(severity: str, service: str, message: str, payload: dict = None):
    """
    Logs an event to both the standard local log system and the Supabase system_logs database table.
    
    severity: 'INFO', 'WARNING', or 'ERROR'
    service: Name of the service calling (e.g., 'API_GATEWAY', 'ROADMAP_GEN', 'SCRAPER')
    message: Main message explaining the event
    payload: Optional dictionary containing metadata
    """
    if payload is None:
        payload = {}

    log_msg = f"[{service}] {message} | Payload: {json.dumps(payload)}"
    
    # 1. Log to console / files via Python Standard Library logger
    if severity.upper() == "INFO":
        logger.info(log_msg)
    elif severity.upper() == "WARNING":
        logger.warning(log_msg)
    elif severity.upper() == "ERROR":
        logger.error(log_msg)
    else:
        logger.info(log_msg)

    # 2. Log to Database if connected
    if db_client:
        try:
            log_data = {
                "severity": severity.upper() if severity.upper() in ["INFO", "WARNING", "ERROR"] else "INFO",
                "service": service,
                "message": message,
                "payload": payload
            }
            db_client.table("system_logs").insert(log_data).execute()
        except Exception as e:
            # We fail silently to console if DB writing fails to prevent halting the main thread
            logger.error(f"[DB_LOGGER_ERROR] Failed to write event to system_logs table: {str(e)}")

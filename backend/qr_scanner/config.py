"""
EventHive QR Scanner Configuration
Stores Supabase credentials, secrets, and application settings.
"""

import os
import json
from pathlib import Path
import logging

# Base directory for the application
BASE_DIR = Path(__file__).parent.parent.parent.absolute()

# Load environment variables from .env file if it exists
env_file = os.path.join(BASE_DIR, ".env.local")
if os.path.exists(env_file):
    try:
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    except Exception as e:
        print(f"Error loading .env file: {e}")

# Supabase credentials
SUPABASE_URL = os.environ.get("EVENTHIVE_SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://your-supabase-url.supabase.co"))
SUPABASE_KEY = os.environ.get("EVENTHIVE_SUPABASE_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "your-supabase-service-key"))

# Supabase tables
SUPABASE_ATTENDEES_TABLE = os.environ.get("EVENTHIVE_SUPABASE_ATTENDEES_TABLE", "booking_attendees")
SUPABASE_EVENTS_TABLE = os.environ.get("EVENTHIVE_SUPABASE_EVENTS_TABLE", "events")
SUPABASE_SCANS_TABLE = os.environ.get("EVENTHIVE_SUPABASE_SCANS_TABLE", "scans")

# HMAC secret (store securely in production)
HMAC_SECRET = os.environ.get("EVENTHIVE_HMAC_SECRET", "your_hmac_secret_here")

# SQLite DB path
DB_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "eventhive_scanner.db")

# Scanner ID
SCANNER_ID = os.environ.get("EVENTHIVE_SCANNER_ID", "scanner_001")

# Scanner settings
SCANNER_NAME = os.environ.get("EVENTHIVE_SCANNER_NAME", "EventHive Check-In")
CAMERA_INDEX = int(os.environ.get("EVENTHIVE_CAMERA_INDEX", "0"))
SCAN_COOLDOWN_SEC = int(os.environ.get("EVENTHIVE_SCAN_COOLDOWN", "2"))

# GUI settings
WINDOW_WIDTH = int(os.environ.get("EVENTHIVE_WINDOW_WIDTH", "800"))
WINDOW_HEIGHT = int(os.environ.get("EVENTHIVE_WINDOW_HEIGHT", "600"))

# Logging settings
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "scanner.log")
LOG_LEVEL = os.environ.get("EVENTHIVE_LOG_LEVEL", "INFO")

"""
EventHive Config
Stores Supabase credentials, HMAC secret, and scanner configuration.
"""

# Supabase credentials
SUPABASE_URL = "https://your-supabase-url.supabase.co"
SUPABASE_KEY = "your-supabase-service-key"

# HMAC secret (store securely in production)
HMAC_SECRET = "your_hmac_secret_here"

# SQLite DB path
DB_PATH = "eventhive_scanner.db"

# Scanner ID
SCANNER_ID = "scanner_001"

# Scanner settings
SCANNER_NAME = "EventHive Check-In"
CAMERA_INDEX = 0
SCAN_COOLDOWN_SEC = 2  # Time between scans to prevent duplicates

# GUI settings
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600

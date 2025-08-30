# EventHive QR Scanner
# Handles QR scanning, local validation, and syncing with Supabase

import cv2
from pyzbar import pyzbar
import hmac
import hashlib
import logging
import time
import json
import threading
from db_manager import DBManager
from supabase_client import SupabaseClient
import config

# Setup logging
logging.basicConfig(
	level=logging.INFO,
	format='%(asctime)s %(levelname)s %(message)s',
	handlers=[logging.FileHandler("scanner.log"), logging.StreamHandler()]
)

def verify_signature(payload: dict, secret_key: str) -> bool:
	"""
	Verifies HMAC-SHA256 signature of the payload.
	"""
	try:
		data = f"{payload['ticket_id']}|{payload['event_id']}"
		signature = payload['signature']
		hmac_obj = hmac.new(secret_key.encode(), data.encode(), hashlib.sha256)
		expected_sig = hmac_obj.hexdigest()
		return hmac.compare_digest(signature, expected_sig)
	except Exception as e:
		logging.error(f"Signature verification error: {e}")
		return False

def decode_qr(frame) -> dict:
	"""
	Decodes QR code from image frame and extracts payload.
	"""
	try:
		barcodes = pyzbar.decode(frame)
		for barcode in barcodes:
			qr_data = barcode.data.decode('utf-8')
			payload = json.loads(qr_data)
			return payload
		return None
	except Exception as e:
		logging.error(f"QR decoding error: {e}")
		return None

def handle_realtime_update(payload):
	"""Callback function for Supabase realtime updates."""
	try:
		logging.info(f"Received realtime update: {payload}")
		# Update local database with new ticket data
		if payload.get('new') and payload['new'].get('ticket_id'):
			ticket = payload['new']
			db = DBManager(config.DB_PATH)
			db.preload_tickets([ticket])
			logging.info(f"Updated local ticket data for {ticket['ticket_id']}")
	except Exception as e:
		logging.error(f"Error handling realtime update: {e}")

def sync_offline_scans(db: DBManager, supabase: SupabaseClient):
    """Background thread to sync offline scan logs."""
    while True:
        try:
            # Get unsynced scans using the DBManager method
            unsynced = db.get_unsynced_scans()
            
            for scan_id, ticket_id, scanner_id, scanned_at in unsynced:
                # Push to Supabase
                supabase.push_scan(ticket_id, scanner_id)
                # Mark as synced using the DBManager method
                db.mark_scan_synced(scan_id)
                logging.info(f"Synced scan {scan_id} for ticket {ticket_id}")
        except Exception as e:
            logging.error(f"Sync error: {e}")
        
        # Sleep for 60 seconds before next sync attempt
        time.sleep(60)

def scan_from_camera(db: DBManager, supabase: SupabaseClient):
    cap = cv2.VideoCapture(0)
    logging.info("Starting camera for QR scanning...")
    
    # Start sync thread
    sync_thread = threading.Thread(target=sync_offline_scans, args=(db, supabase), daemon=True)
    sync_thread.start()
    
    # Subscribe to realtime updates
    supabase.subscribe_realtime_updates(handle_realtime_update)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            logging.error("Camera read failed.")
            continue
            
        payload = decode_qr(frame)
        if payload:
            logging.info(f"QR payload: {payload}")
            
            # Signature verification
            if not verify_signature(payload, config.HMAC_SECRET):
                logging.warning("Invalid QR signature. Access denied.")
                continue
                
            # Local duplicate check
            if db.is_ticket_scanned(payload['ticket_id']):
                logging.warning("Duplicate ticket detected. Access denied.")
                continue
                
            # Mark as scanned locally
            db.mark_ticket_scanned(payload['ticket_id'])
            db.add_scan_log(payload['ticket_id'], config.SCANNER_ID)
            logging.info("Ticket scanned and marked locally.")
            
            # Try immediate sync if possible
            try:
                supabase.push_scan(payload['ticket_id'], config.SCANNER_ID)
                logging.info(f"Scan pushed for ticket {payload['ticket_id']}")
            except Exception as e:
                logging.warning(f"Couldn't push scan, will sync later: {e}")
                
        cv2.imshow('EventHive QR Scanner', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

def preload_event_tickets(db: DBManager, supabase: SupabaseClient, event_id: str):
    """Preload all tickets for an event from Supabase to local SQLite."""
    logging.info(f"Preloading tickets for event {event_id}...")
    tickets = supabase.preload_tickets(event_id)
    if tickets:
        db.preload_tickets(tickets)
        logging.info(f"Preloaded {len(tickets)} tickets to local database.")
    else:
        logging.warning("No tickets preloaded. Check event ID or network connection.")

if __name__ == "__main__":
    db = DBManager(config.DB_PATH)
    supabase = SupabaseClient(config.SUPABASE_URL, config.SUPABASE_KEY)
    
    # Prompt for event ID
    event_id = input("Enter event ID to preload tickets: ")
    preload_event_tickets(db, supabase, event_id)
    
    # Start scanning
    scan_from_camera(db, supabase)
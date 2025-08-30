"""
EventHive Supabase Client
Handles Supabase connection, ticket preload, scan push, and realtime updates.
"""

from supabase import create_client, Client
import logging
import config

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)
        logging.info("Supabase client initialized.")

    def preload_tickets(self, event_id: str):
        """Fetch all tickets for event from Supabase."""
        try:
            # Updated to use booking_attendees table
            response = self.client.table('booking_attendees').select('*').eq('event_id', event_id).execute()
            return response.data
        except Exception as e:
            logging.error(f"Preload tickets error: {e}")
            return []
            
    def get_attendee_by_qr(self, qr_code: str):
        """Fetch attendee data by QR code from booking_attendees table"""
        try:
            response = self.client.table('booking_attendees').select('*').eq('qr_code', qr_code).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logging.error(f"Get attendee by QR error: {e}")
            return None

    def push_scan(self, qr_code: str, scanner_id: str):
        """Push scan log to Supabase and update attendee check-in status."""
        try:
            # First, record the scan
            scan_data = {
                'qr_code': qr_code,
                'scanner_id': scanner_id,
                'scanned_at': 'now()',
                'synced': True
            }
            self.client.table('scans').insert(scan_data).execute()
            
            # Then, update attendee status to checked-in
            self.client.table('booking_attendees').update({'checked_in': True, 'checked_in_at': 'now()'}).eq('qr_code', qr_code).execute()
            
            logging.info(f"Scan pushed and attendee checked in for QR code {qr_code}")
            return True
        except Exception as e:
            logging.error(f"Push scan error: {e}")
            return False

    def subscribe_realtime_updates(self, callback):
        """
        Subscribe to realtime updates for tickets table.
        Note: This feature requires the async Supabase client.
        For sync client, we'll poll for updates instead.
        """
        try:
            # For sync client, we can't use realtime subscriptions
            # Instead, we'll use polling in a background thread
            logging.info("Realtime subscriptions not available in sync client. Will use polling instead.")
            return False
        except Exception as e:
            logging.error(f"Realtime subscription error: {e}")
            return False

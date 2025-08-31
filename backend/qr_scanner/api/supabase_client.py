"""
EventHive Supabase Client
Handles Supabase connection, ticket preload, scan push, verification, and realtime updates.
"""

from supabase import create_client, Client
import logging
import time
import json
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime
from ..config import SUPABASE_URL, SUPABASE_KEY
from ..utils.error_handler import ApiError

class SupabaseClient:
    """Client for interacting with Supabase APIs"""
    
    def __init__(self, url: str = SUPABASE_URL, key: str = SUPABASE_KEY):
        """
        Initialize Supabase client
        
        Args:
            url: Supabase URL
            key: Supabase API key
        """
        self.client: Client = create_client(url, key)
        self.connection_verified = False
        try:
            # Test connection
            self.client.table('booking_attendees').select('count', count='exact').limit(1).execute()
            self.connection_verified = True
            logging.info("Supabase client initialized and connection verified")
        except Exception as e:
            logging.error(f"Supabase connection error: {e}")
            logging.warning("Running in offline mode")

    def preload_tickets(self, event_id: str):
        """
        Fetch all tickets for event from Supabase
        
        Args:
            event_id: ID of the event to fetch tickets for
            
        Returns:
            List of attendee data dictionaries
        """
        try:
            # Updated to use booking_attendees table
            response = self.client.table('booking_attendees').select('*').eq('event_id', event_id).execute()
            logging.info(f"Fetched {len(response.data)} attendees for event {event_id}")
            return response.data
        except Exception as e:
            logging.error(f"Preload tickets error: {e}")
            return []
            
    def get_attendee_by_qr(self, qr_code: str):
        """
        Fetch attendee data by QR code from booking_attendees table
        
        Args:
            qr_code: QR code to look up
            
        Returns:
            Attendee data dictionary or None if not found
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, can't fetch attendee")
            return None
            
        try:
            response = self.client.table('booking_attendees').select('*').eq('qr_code', qr_code).execute()
            if response.data and len(response.data) > 0:
                logging.info(f"Found attendee for QR code: {qr_code}")
                return response.data[0]
            logging.warning(f"No attendee found for QR code: {qr_code}")
            return None
        except Exception as e:
            logging.error(f"Get attendee by QR error: {e}")
            return None
            
    def verify_qr_code(self, qr_code: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Verify if a QR code is valid by checking against Supabase
        
        Args:
            qr_code: The QR code to verify
            
        Returns:
            Tuple containing:
            - Boolean indicating if QR code is valid
            - Attendee data if valid, None otherwise
            - Message explaining the result
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, skipping online verification")
            return False, None, "Cannot connect to Supabase for verification"
            
        try:
            # Get attendee data
            attendee = self.get_attendee_by_qr(qr_code)
            
            if not attendee:
                return False, None, "QR code not found in database"
                
            # Check if attendee is already checked in
            if attendee.get('checked_in', False):
                # Get check-in time
                checked_in_at = attendee.get('checked_in_at')
                return False, attendee, f"Attendee already checked in at {checked_in_at}"
            
            # Check if the event date is valid
            if 'event' in attendee and 'event_date' in attendee['event']:
                event_date = attendee['event']['event_date']
                # TODO: Implement date validation if needed
            
            return True, attendee, "QR code valid"
            
        except Exception as e:
            logging.error(f"QR code verification error: {e}")
            return False, None, f"Verification error: {str(e)}"

    def push_scan(self, qr_code: str, scanner_id: str):
        """
        Push scan log to Supabase and update attendee check-in status
        
        Args:
            qr_code: QR code that was scanned
            scanner_id: ID of the scanner device
            
        Returns:
            True on success, False on failure
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, can't push scan")
            return False
            
        try:
            # Get current timestamp in ISO format
            current_time = datetime.utcnow().isoformat()
            
            # First, record the scan
            scan_data = {
                'qr_code': qr_code,
                'scanner_id': scanner_id,
                'scanned_at': current_time,
                'synced': True
            }
            self.client.table('scans').insert(scan_data).execute()
            
            # Then, update attendee status to checked-in
            self.client.table('booking_attendees').update({
                'checked_in': True, 
                'checked_in_at': current_time
            }).eq('qr_code', qr_code).execute()
            
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
        
        Args:
            callback: Function to call when updates are received
            
        Returns:
            True on success, False on failure
        """
        try:
            # For sync client, we can't use realtime subscriptions
            # Instead, we'll use polling in a background thread
            logging.info("Realtime subscriptions not available in sync client. Will use polling instead.")
            return False
        except Exception as e:
            logging.error(f"Realtime subscription error: {e}")
            return False
            
    def get_event_details(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch event details from Supabase
        
        Args:
            event_id: The ID of the event to fetch
            
        Returns:
            Event details dictionary or None if not found
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, can't get event details")
            return None
            
        try:
            response = self.client.table('events').select('*').eq('id', event_id).execute()
            if response.data and len(response.data) > 0:
                logging.info(f"Found event details for event: {event_id}")
                return response.data[0]
            logging.warning(f"No event found with ID: {event_id}")
            return None
        except Exception as e:
            logging.error(f"Get event details error: {e}")
            return None
            
    def get_attendee_count(self, event_id: str) -> Tuple[int, int]:
        """
        Get attendee counts for an event
        
        Args:
            event_id: The ID of the event
            
        Returns:
            Tuple of (total_attendees, checked_in_attendees)
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, can't get attendee counts")
            return (0, 0)
            
        try:
            # Get total count
            total_response = self.client.table('booking_attendees').select('count', count='exact').eq('event_id', event_id).execute()
            total = total_response.count if hasattr(total_response, 'count') else 0
            
            # Get checked in count
            checked_in_response = self.client.table('booking_attendees').select('count', count='exact').eq('event_id', event_id).eq('checked_in', True).execute()
            checked_in = checked_in_response.count if hasattr(checked_in_response, 'count') else 0
            
            logging.info(f"Attendee count for event {event_id}: {checked_in}/{total} checked in")
            return (total, checked_in)
        except Exception as e:
            logging.error(f"Get attendee count error: {e}")
            return (0, 0)
            
    def bulk_verify_qr_codes(self, qr_codes: List[str]) -> Dict[str, Tuple[bool, str]]:
        """
        Verify multiple QR codes at once
        
        Args:
            qr_codes: List of QR codes to verify
            
        Returns:
            Dictionary mapping QR codes to (is_valid, message) tuples
        """
        if not self.connection_verified:
            logging.warning("Supabase connection not available, can't verify QR codes")
            return {qr_code: (False, "Supabase connection not available") for qr_code in qr_codes}
            
        results = {}
        try:
            # Use a single query to get all attendees
            in_expression = f"in.({','.join(qr_codes)})"
            response = self.client.table('booking_attendees').select('*').filter('qr_code', in_expression).execute()
            
            # Create a lookup dictionary
            attendees_by_qr = {attendee['qr_code']: attendee for attendee in response.data}
            
            # Process each QR code
            for qr_code in qr_codes:
                if qr_code in attendees_by_qr:
                    attendee = attendees_by_qr[qr_code]
                    if attendee.get('checked_in', False):
                        results[qr_code] = (False, f"Already checked in at {attendee.get('checked_in_at')}")
                    else:
                        results[qr_code] = (True, "QR code valid")
                else:
                    results[qr_code] = (False, "QR code not found")
                    
            return results
        except Exception as e:
            logging.error(f"Bulk QR code verification error: {e}")
            return {qr_code: (False, f"Verification error: {str(e)}") for qr_code in qr_codes}

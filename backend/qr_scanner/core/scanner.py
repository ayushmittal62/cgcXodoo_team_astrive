"""
Core QR scanning functionality for EventHive
"""

import cv2
from pyzbar import pyzbar
import hmac
import hashlib
import logging
import json
import time
import os
from typing import Dict, Optional, Tuple, Any, List, Union

from ..utils.error_handler import ScannerError
from ..api.supabase_client import SupabaseClient
from ..db.database import DBManager

class QRScanner:
    """Core QR scanner functionality with Supabase integration"""
    
    def __init__(self, hmac_secret: str, supabase_client: Optional[SupabaseClient] = None, db_manager: Optional[DBManager] = None):
        """
        Initialize QR scanner
        
        Args:
            hmac_secret: Secret key for HMAC validation
            supabase_client: Optional Supabase client for online verification
            db_manager: Optional DB manager for local verification
        """
        self.hmac_secret = hmac_secret
        self.supabase = supabase_client
        self.db = db_manager
        self.last_scan_time = 0
        self.scan_cooldown = 2  # seconds between scans to prevent duplicates
        logging.info("QR scanner initialized")
        
    def scan_image(self, frame) -> Optional[str]:
        """
        Scan an image for QR codes
        
        Args:
            frame: Image frame to scan
            
        Returns:
            QR code string if found, None otherwise
        """
        try:
            barcodes = pyzbar.decode(frame)
            for barcode in barcodes:
                qr_data = barcode.data.decode('utf-8')
                logging.debug(f"QR code found: {qr_data}")
                return qr_data
            return None
        except Exception as e:
            logging.error(f"QR decoding error: {e}")
            return None
            
    def verify_signature(self, payload: Dict[str, str]) -> bool:
        """
        Verify HMAC-SHA256 signature of a payload
        
        Args:
            payload: Dictionary containing ticket_id, event_id and signature
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Support different payload formats
            if 'ticket_id' in payload and 'event_id' in payload and 'signature' in payload:
                # Original format
                data = f"{payload['ticket_id']}|{payload['event_id']}"
                signature = payload['signature']
            elif 'qr_code' in payload and 'signature' in payload:
                # New format - direct QR code
                data = payload['qr_code']
                signature = payload['signature']
            else:
                logging.error(f"Unknown payload format: {payload.keys()}")
                return False
                
            hmac_obj = hmac.new(self.hmac_secret.encode(), data.encode(), hashlib.sha256)
            expected_sig = hmac_obj.hexdigest()
            return hmac.compare_digest(signature, expected_sig)
        except Exception as e:
            logging.error(f"Signature verification error: {e}")
            return False
            
    def parse_qr_data(self, qr_data: str) -> Optional[Dict[str, Any]]:
        """
        Parse QR data string
        
        Args:
            qr_data: QR code data string
            
        Returns:
            Parsed data or None if invalid
        """
        try:
            # First try to parse as JSON
            return json.loads(qr_data)
        except json.JSONDecodeError:
            # If not JSON, just return the string as-is
            # This handles the case where QR code is just a simple string
            return qr_data.strip()
        except Exception as e:
            logging.error(f"QR data parsing error: {e}")
            return None
            
    def verify_qr_code(self, qr_data: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Comprehensive QR code verification with Supabase integration
        
        Args:
            qr_data: QR code data to verify
            
        Returns:
            Tuple containing:
            - Boolean indicating if QR code is valid
            - Dictionary with verification details
            - Message explaining the result
        """
        # Prevent rapid scanning of the same code
        current_time = time.time()
        if current_time - self.last_scan_time < self.scan_cooldown:
            return False, {"status": "cooldown"}, "Please wait between scans"
            
        self.last_scan_time = current_time
        
        # Step 1: Parse the QR data
        parsed_data = self.parse_qr_data(qr_data)
        if parsed_data is None:
            return False, {"status": "parse_error"}, "Failed to parse QR data"
            
        # Step 2: Determine QR type (JSON or direct string)
        result_data = {"raw_qr": qr_data}
        
        # Step 3: Check signature if applicable
        if isinstance(parsed_data, dict) and 'signature' in parsed_data:
            # QR contains signature for verification
            signature_valid = self.verify_signature(parsed_data)
            result_data["signature_verified"] = signature_valid
            
            if not signature_valid:
                return False, result_data, "Invalid signature"
                
            # Add parsed data to result
            result_data.update(parsed_data)
        else:
            # Simple QR code (just the QR string)
            result_data["qr_code"] = qr_data if isinstance(parsed_data, str) else str(parsed_data)
            
        # Step 4: Verify against Supabase if available
        if self.supabase:
            try:
                # Use QR code directly or extract from parsed data
                verification_qr = qr_data
                if isinstance(parsed_data, dict) and 'qr_code' in parsed_data:
                    verification_qr = parsed_data['qr_code']
                
                is_valid, attendee_data, message = self.supabase.verify_qr_code(verification_qr)
                
                # Add Supabase data to result
                if attendee_data:
                    result_data["attendee"] = attendee_data
                    result_data["event_id"] = attendee_data.get('event_id')
                    result_data["verified_online"] = True
                    
                if is_valid:
                    return True, result_data, message
                else:
                    return False, result_data, message
            except Exception as e:
                logging.error(f"Supabase verification error: {e}")
                # Continue to local verification
        
        # Step 5: Verify against local database if available
        if self.db:
            try:
                # Use QR code directly or extract from parsed data
                verification_qr = qr_data
                if isinstance(parsed_data, dict) and 'qr_code' in parsed_data:
                    verification_qr = parsed_data['qr_code']
                    
                # Check if in local database
                if self.db.is_attendee_in_db(verification_qr):
                    result_data["verified_local"] = True
                    
                    # Check if already checked in
                    if self.db.is_attendee_checked_in(verification_qr):
                        return False, result_data, "Attendee already checked in (local database)"
                    
                    return True, result_data, "QR code valid (local database)"
                else:
                    result_data["verified_local"] = False
                    
            except Exception as e:
                logging.error(f"Local verification error: {e}")
                
        # Step 6: If we've reached here without verification, check if signature was valid
        if result_data.get("signature_verified", False):
            return True, result_data, "QR code valid (signature verified)"
            
        # Step 7: Last resort - if it's a simple QR code with no verification method
        if isinstance(parsed_data, str):
            return True, result_data, "QR code accepted (no verification method)"
            
        # Default case - reject
        return False, result_data, "QR code could not be verified"

    def get_camera_device(self, camera_index: int = 0) -> Tuple[cv2.VideoCapture, int, int]:
        """
        Initialize a camera device
        
        Args:
            camera_index: Index of the camera to use
            
        Returns:
            Tuple of (capture device, width, height)
        """
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            raise ValueError(f"Unable to open camera {camera_index}")
            
        # Get video dimensions
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        return cap, width, height

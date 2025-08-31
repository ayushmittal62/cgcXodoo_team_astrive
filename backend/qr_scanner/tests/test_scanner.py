"""
EventHive QR Scanner Tests
Unit tests for the QR scanner application
"""

import unittest
import os
import tempfile
import json
from pathlib import Path
import sys
from unittest.mock import MagicMock, patch

# Add the parent directory to the path to import our modules
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from backend.qr_scanner.core.scanner import QRScanner
from backend.qr_scanner.db.database import DBManager
from backend.qr_scanner.utils import generate_hmac_signature, verify_hmac_signature
from backend.qr_scanner import config


class TestQRScanner(unittest.TestCase):
    """
    Tests for the QR Scanner core functionality
    """
    
    def setUp(self):
        """Set up test environment"""
        self.secret = "test_secret_key"
        self.scanner = QRScanner(self.secret)
    
    def test_verification(self):
        """Test HMAC verification"""
        # Create a valid QR code
        test_data = {"ticket_id": "1234", "event_id": "5678", "issued_to": "Test User"}
        test_data_str = json.dumps(test_data)
        signature = generate_hmac_signature(test_data_str, self.secret)
        
        # Test verification
        result = verify_hmac_signature(test_data_str, signature, self.secret)
        self.assertTrue(result, "Signature verification should pass")
        
        # Test with invalid signature
        invalid_signature = "invalid_signature"
        result = verify_hmac_signature(test_data_str, invalid_signature, self.secret)
        self.assertFalse(result, "Invalid signature should fail verification")
    
    @patch('cv2.VideoCapture')
    def test_camera_device(self, mock_video_capture):
        """Test camera device handling"""
        # Mock the VideoCapture class
        mock_instance = MagicMock()
        mock_instance.isOpened.return_value = True
        mock_instance.read.return_value = (True, MagicMock())
        mock_video_capture.return_value = mock_instance
        
        # Test get_camera_device
        vid, width, height = self.scanner.get_camera_device(0)
        self.assertIsNotNone(vid, "Should return a video capture device")


class TestDatabase(unittest.TestCase):
    """
    Tests for the Database functionality
    """
    
    def setUp(self):
        """Set up test environment"""
        # Create a temporary database file
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.db_path = self.temp_db.name
        self.temp_db.close()
        
        # Create the database manager
        self.db = DBManager(self.db_path)
    
    def tearDown(self):
        """Clean up test environment"""
        # Close the database connection
        self.db.conn.close()
        
        # Remove the temporary database file
        os.unlink(self.db_path)
    
    def test_database_initialization(self):
        """Test database initialization"""
        # Verify that tables were created
        cursor = self.db.conn.cursor()
        
        # Check if booking_attendees table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='booking_attendees'")
        result = cursor.fetchone()
        self.assertIsNotNone(result, "booking_attendees table should be created")
        
        # Check if scans_local table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scans_local'")
        result = cursor.fetchone()
        self.assertIsNotNone(result, "scans_local table should be created")
    
    def test_attendee_operations(self):
        """Test attendee operations"""
        # Add test data
        test_attendees = [
            {
                "id": "1",
                "event_id": "event1",
                "qr_code": "qr_code1",
                "attendee_name": "John Doe",
                "attendee_email": "john@example.com",
                "checked_in": False,
                "checked_in_at": None,
                "updated_at": "2023-01-01T00:00:00"
            }
        ]
        
        # Preload attendees
        self.db.preload_tickets(test_attendees)
        
        # Check if attendee is in database
        result = self.db.is_attendee_in_db("qr_code1")
        self.assertTrue(result, "Attendee should be in database")
        
        # Check if attendee is checked in (should be False)
        result = self.db.is_attendee_checked_in("qr_code1")
        self.assertFalse(result, "Attendee should not be checked in")
        
        # Mark attendee as checked in
        self.db.mark_attendee_checked_in("qr_code1")
        
        # Check if attendee is checked in (should be True)
        result = self.db.is_attendee_checked_in("qr_code1")
        self.assertTrue(result, "Attendee should be checked in")
        
        # Add scan log
        self.db.add_scan_log("qr_code1", "scanner1")
        
        # Get unsynced scans
        unsynced = self.db.get_unsynced_scans()
        self.assertEqual(len(unsynced), 1, "Should have one unsynced scan")
        
        # Mark scan as synced
        scan_id = unsynced[0][0]
        self.db.mark_scan_synced(scan_id)
        
        # Get unsynced scans again (should be empty)
        unsynced = self.db.get_unsynced_scans()
        self.assertEqual(len(unsynced), 0, "Should have no unsynced scans")


if __name__ == '__main__':
    unittest.main()

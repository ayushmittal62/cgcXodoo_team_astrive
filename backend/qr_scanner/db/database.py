"""
EventHive DB Manager
Handles all SQLite operations for offline-first validation and logging.
"""

import sqlite3
import logging
import time
import os
from pathlib import Path
from ..config import DB_PATH

class DBManager:
    """
    Database manager for local SQLite operations
    """
    def __init__(self, db_path=DB_PATH):
        """
        Initialize database connection and create tables if they don't exist
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        
        # Ensure directory exists
        db_dir = Path(db_path).parent
        os.makedirs(db_dir, exist_ok=True)
        
        # Connect to database
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.create_tables()
        logging.info(f"Database initialized at {db_path}")

    def create_tables(self):
        """Create necessary tables if they don't exist"""
        cursor = self.conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS booking_attendees (
            id TEXT PRIMARY KEY,
            event_id TEXT,
            qr_code TEXT UNIQUE,
            attendee_name TEXT,
            attendee_email TEXT,
            ticket_type TEXT,
            checked_in INTEGER DEFAULT 0,
            checked_in_at TEXT,
            updated_at TEXT,
            verification_status TEXT
        )''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_qr_code ON booking_attendees(qr_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_id ON booking_attendees(event_id)')
        
        cursor.execute('''CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT,
            event_date TEXT,
            venue TEXT,
            organizer_id TEXT,
            updated_at TEXT
        )''')
        
        cursor.execute('''CREATE TABLE IF NOT EXISTS scans_local (
            scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_code TEXT,
            scanner_id TEXT,
            scanned_at TEXT,
            synced INTEGER DEFAULT 0
        )''')
        self.conn.commit()

    def is_attendee_checked_in(self, qr_code: str) -> bool:
        """
        Check if an attendee has already been checked in
        
        Args:
            qr_code: QR code of the attendee
            
        Returns:
            True if already checked in, False otherwise
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT checked_in FROM booking_attendees WHERE qr_code=?", (qr_code,))
        row = cursor.fetchone()
        return row is not None and row[0] == 1

    def mark_attendee_checked_in(self, qr_code: str):
        """
        Mark an attendee as checked in
        
        Args:
            qr_code: QR code of the attendee
        """
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        cursor = self.conn.cursor()
        cursor.execute("UPDATE booking_attendees SET checked_in=1, checked_in_at=?, updated_at=? WHERE qr_code=?", 
                      (timestamp, timestamp, qr_code))
        self.conn.commit()
        logging.info(f"Attendee with QR code {qr_code} marked as checked in")

    def add_scan_log(self, qr_code: str, scanner_id: str):
        """
        Add a scan log entry
        
        Args:
            qr_code: QR code that was scanned
            scanner_id: ID of the scanner device
        """
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO scans_local (qr_code, scanner_id, scanned_at, synced) VALUES (?, ?, ?, 0)",
                       (qr_code, scanner_id, time.strftime('%Y-%m-%d %H:%M:%S')))
        self.conn.commit()
        logging.debug(f"Scan log added for QR code {qr_code}")

    def preload_tickets(self, attendees: list):
        """
        Preload attendee data to local database
        
        Args:
            attendees: List of attendee data dictionaries
        """
        cursor = self.conn.cursor()
        for a in attendees:
            # First, store event data if present
            if 'event' in a and isinstance(a['event'], dict):
                event = a['event']
                cursor.execute("""
                    INSERT OR REPLACE INTO events
                    (id, name, event_date, venue, organizer_id, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        event.get('id', ''),
                        event.get('name', ''),
                        event.get('event_date', ''),
                        event.get('venue', ''),
                        event.get('organizer_id', ''),
                        event.get('updated_at', '')
                    )
                )
            
            # Then store attendee data
            cursor.execute("""
                INSERT OR REPLACE INTO booking_attendees 
                (id, event_id, qr_code, attendee_name, attendee_email, ticket_type, checked_in, checked_in_at, updated_at, verification_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    a.get('id', ''), 
                    a.get('event_id', ''),
                    a.get('qr_code', ''),
                    a.get('attendee_name', ''),
                    a.get('attendee_email', ''),
                    a.get('ticket_type', ''),
                    1 if a.get('checked_in') else 0,
                    a.get('checked_in_at', ''),
                    a.get('updated_at', ''),
                    a.get('verification_status', 'pending')
                )
            )
        self.conn.commit()
        logging.info(f"Preloaded {len(attendees)} attendees to local database")
        
    def get_unsynced_scans(self):
        """
        Get all unsynced scans from local database
        
        Returns:
            List of tuples with scan data
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT scan_id, qr_code, scanner_id, scanned_at FROM scans_local WHERE synced=0")
        return cursor.fetchall()
        
    def mark_scan_synced(self, scan_id: int):
        """
        Mark a scan as synced
        
        Args:
            scan_id: ID of the scan to mark
        """
        cursor = self.conn.cursor()
        cursor.execute("UPDATE scans_local SET synced=1 WHERE scan_id=?", (scan_id,))
        self.conn.commit()
        logging.debug(f"Scan {scan_id} marked as synced")
        
    def is_attendee_in_db(self, qr_code: str) -> bool:
        """
        Check if an attendee exists in the local database
        
        Args:
            qr_code: QR code of the attendee
            
        Returns:
            True if attendee exists, False otherwise
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT id FROM booking_attendees WHERE qr_code=?", (qr_code,))
        row = cursor.fetchone()
        return row is not None
        
    def get_attendee_by_qr(self, qr_code: str) -> dict:
        """
        Get attendee data by QR code
        
        Args:
            qr_code: QR code of the attendee
            
        Returns:
            Dictionary with attendee data or None if not found
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT ba.*, e.name as event_name, e.event_date, e.venue
            FROM booking_attendees ba
            LEFT JOIN events e ON ba.event_id = e.id
            WHERE ba.qr_code=?
        """, (qr_code,))
        row = cursor.fetchone()
        
        if not row:
            return None
            
        # Convert row to dictionary
        columns = [col[0] for col in cursor.description]
        return {columns[i]: row[i] for i in range(len(columns))}
        
    def verify_qr_code(self, qr_code: str) -> tuple:
        """
        Verify QR code against local database
        
        Args:
            qr_code: QR code to verify
            
        Returns:
            Tuple of (is_valid, message)
        """
        if not self.is_attendee_in_db(qr_code):
            return False, "QR code not found in local database"
            
        if self.is_attendee_checked_in(qr_code):
            return False, "Attendee already checked in"
            
        # Get attendee details for event validation if needed
        attendee = self.get_attendee_by_qr(qr_code)
        
        # You could add additional validation here (e.g., check event date)
        
        return True, "QR code valid"
        
    def update_verification_status(self, qr_code: str, status: str):
        """
        Update verification status for an attendee
        
        Args:
            qr_code: QR code of the attendee
            status: New verification status
        """
        cursor = self.conn.cursor()
        cursor.execute("UPDATE booking_attendees SET verification_status=? WHERE qr_code=?", (status, qr_code))
        self.conn.commit()
        logging.info(f"Updated verification status to '{status}' for QR code {qr_code}")
        
    def get_event_attendees(self, event_id: str, checked_in_only: bool = False):
        """
        Get all attendees for an event
        
        Args:
            event_id: ID of the event
            checked_in_only: If True, only return checked-in attendees
            
        Returns:
            List of attendee data dictionaries
        """
        cursor = self.conn.cursor()
        query = "SELECT * FROM booking_attendees WHERE event_id=?"
        if checked_in_only:
            query += " AND checked_in=1"
            
        cursor.execute(query, (event_id,))
        
        # Convert rows to dictionaries
        columns = [col[0] for col in cursor.description]
        return [
            {columns[i]: row[i] for i in range(len(columns))}
            for row in cursor.fetchall()
        ]
    
    def close(self):
        """Close the database connection"""
        self.conn.close()

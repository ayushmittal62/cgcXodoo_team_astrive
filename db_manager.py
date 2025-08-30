import sqlite3
import logging
import time

class DBManager:
	def __init__(self, db_path: str):
		self.db_path = db_path
		self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
		self.create_tables()

	def create_tables(self):
		cursor = self.conn.cursor()
		cursor.execute('''CREATE TABLE IF NOT EXISTS booking_attendees (
			id TEXT PRIMARY KEY,
			event_id TEXT,
			qr_code TEXT UNIQUE,
			attendee_name TEXT,
			attendee_email TEXT,
			checked_in INTEGER DEFAULT 0,
			checked_in_at TEXT,
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
		cursor = self.conn.cursor()
		cursor.execute("SELECT checked_in FROM booking_attendees WHERE qr_code=?", (qr_code,))
		row = cursor.fetchone()
		return row is not None and row[0] == 1

	def mark_attendee_checked_in(self, qr_code: str):
		timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
		cursor = self.conn.cursor()
		cursor.execute("UPDATE booking_attendees SET checked_in=1, checked_in_at=?, updated_at=? WHERE qr_code=?", 
					  (timestamp, timestamp, qr_code))
		self.conn.commit()

	def add_scan_log(self, qr_code: str, scanner_id: str):
		cursor = self.conn.cursor()
		cursor.execute("INSERT INTO scans_local (qr_code, scanner_id, scanned_at, synced) VALUES (?, ?, ?, 0)",
					   (qr_code, scanner_id, time.strftime('%Y-%m-%d %H:%M:%S')))
		self.conn.commit()

	def preload_tickets(self, attendees: list):
		cursor = self.conn.cursor()
		for a in attendees:
			cursor.execute("""
				INSERT OR REPLACE INTO booking_attendees 
				(id, event_id, qr_code, attendee_name, attendee_email, checked_in, checked_in_at, updated_at) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				""",
				(
					a.get('id', ''), 
					a.get('event_id', ''),
					a.get('qr_code', ''),
					a.get('attendee_name', ''),
					a.get('attendee_email', ''),
					1 if a.get('checked_in') else 0,
					a.get('checked_in_at', ''),
					a.get('updated_at', '')
				)
			)
		self.conn.commit()
		
	def get_unsynced_scans(self):
		"""Get all unsynced scans from local database."""
		cursor = self.conn.cursor()
		cursor.execute("SELECT scan_id, ticket_id, scanner_id, scanned_at FROM scans_local WHERE synced=0")
		return cursor.fetchall()
		
	def mark_scan_synced(self, scan_id: int):
		"""Mark a scan as synced."""
		cursor = self.conn.cursor()
		cursor.execute("UPDATE scans_local SET synced=1 WHERE scan_id=?", (scan_id,))
		self.conn.commit()
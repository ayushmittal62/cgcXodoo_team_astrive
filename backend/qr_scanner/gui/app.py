"""
EventHive GUI QR Scanner
A graphical QR code scanner for event check-in
"""

import tkinter as tk
from tkinter import ttk, messagebox
import PIL.Image, PIL.ImageTk
import cv2
from pyzbar import pyzbar
import logging
import time
import threading
import os
from typing import Dict, Any, Optional, Callable

from ..db.database import DBManager
from ..api.supabase_client import SupabaseClient
from ..core.scanner import QRScanner
from .. import config

class QRScannerApp:
    """Main GUI application for QR scanner"""
    
    def __init__(self, window, window_title="EventHive QR Scanner"):
        """
        Initialize the scanner application
        
        Args:
            window: tkinter root window
            window_title: Title for the window
        """
        # Initialize the window
        self.window = window
        self.window.title(window_title)
        self.window.resizable(width=True, height=True)
        self.window.configure(bg="#f0f0f0")
        
        # Set window size and position
        window_width = config.WINDOW_WIDTH
        window_height = config.WINDOW_HEIGHT
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.window.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Initialize core components
        self.db = DBManager(config.DB_PATH)
        self.supabase = SupabaseClient(config.SUPABASE_URL, config.SUPABASE_KEY)
        self.scanner = QRScanner(config.HMAC_SECRET, self.supabase, self.db)
        
        # Video capture
        self.vid = None  # Will be initialized later
        self.camera_index = config.CAMERA_INDEX
        
        # Create GUI elements
        self.create_widgets()
        
        # Status variables
        self.last_scan_time = 0
        self.scan_cooldown = config.SCAN_COOLDOWN_SEC
        self.processing_qr = False
        self.current_event_id = None
        
        # Start sync thread
        self.sync_thread = threading.Thread(target=self.sync_offline_scans, daemon=True)
        self.sync_thread.start()
        
        # Start polling thread instead of realtime subscriptions
        self.polling_thread = threading.Thread(target=self.poll_for_ticket_updates, daemon=True)
        self.polling_thread.start()
        
        # Start camera
        self.start_camera()
        
        # Update loop
        self.update()
        
    def create_widgets(self):
        """Create all GUI widgets"""
        # Main frame
        self.main_frame = ttk.Frame(self.window, padding="10")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Top controls frame
        self.controls_frame = ttk.Frame(self.main_frame)
        self.controls_frame.pack(fill=tk.X, pady=10)
        
        # Event selection
        ttk.Label(self.controls_frame, text="Event ID:").pack(side=tk.LEFT, padx=5)
        self.event_id_var = tk.StringVar()
        self.event_id_entry = ttk.Entry(self.controls_frame, textvariable=self.event_id_var, width=15)
        self.event_id_entry.pack(side=tk.LEFT, padx=5)
        
        # Load tickets button
        self.load_button = ttk.Button(self.controls_frame, text="Load Tickets", command=self.load_event_tickets)
        self.load_button.pack(side=tk.LEFT, padx=5)
        
        # Camera selection
        ttk.Label(self.controls_frame, text="Camera:").pack(side=tk.LEFT, padx=5)
        self.camera_var = tk.StringVar(value=str(self.camera_index))
        self.camera_combo = ttk.Combobox(self.controls_frame, textvariable=self.camera_var, width=5, values=["0", "1", "2"])
        self.camera_combo.pack(side=tk.LEFT, padx=5)
        self.camera_combo.bind("<<ComboboxSelected>>", self.change_camera)
        
        # Status label
        self.status_var = tk.StringVar(value="Ready to scan")
        self.status_label = ttk.Label(self.controls_frame, textvariable=self.status_var, font=("Arial", 12))
        self.status_label.pack(side=tk.RIGHT, padx=10)
        
        # Video frame
        self.video_frame = ttk.Frame(self.main_frame, borderwidth=2, relief="groove")
        self.video_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Canvas for video display
        self.canvas = tk.Canvas(self.video_frame, bg="black")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # Results frame
        self.results_frame = ttk.Frame(self.main_frame)
        self.results_frame.pack(fill=tk.X, pady=10)
        
        # Scan result display
        self.result_frame = ttk.LabelFrame(self.results_frame, text="Last Scan Result", padding=10)
        self.result_frame.pack(fill=tk.X)
        
        # Grid for ticket details
        self.result_grid = ttk.Frame(self.result_frame)
        self.result_grid.pack(fill=tk.X, padx=5, pady=5)
        
        # QR Code
        ttk.Label(self.result_grid, text="QR Code:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.ticket_id_var = tk.StringVar()
        ttk.Label(self.result_grid, textvariable=self.ticket_id_var, font=("Arial", 10, "bold")).grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Event ID
        ttk.Label(self.result_grid, text="Event ID:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.event_id_result_var = tk.StringVar()
        ttk.Label(self.result_grid, textvariable=self.event_id_result_var).grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Attendee Info
        ttk.Label(self.result_grid, text="Attendee:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        self.issued_to_var = tk.StringVar()
        ttk.Label(self.result_grid, textvariable=self.issued_to_var).grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Status
        ttk.Label(self.result_grid, text="Status:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=2)
        self.ticket_status_var = tk.StringVar()
        self.ticket_status_label = ttk.Label(self.result_grid, textvariable=self.ticket_status_var, font=("Arial", 11, "bold"))
        self.ticket_status_label.grid(row=3, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Message
        ttk.Label(self.result_grid, text="Message:").grid(row=4, column=0, sticky=tk.W, padx=5, pady=2)
        self.message_var = tk.StringVar()
        self.message_label = ttk.Label(self.result_grid, textvariable=self.message_var)
        self.message_label.grid(row=4, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Status bar
        self.status_bar = ttk.Frame(self.window)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        ttk.Separator(self.status_bar, orient=tk.HORIZONTAL).pack(fill=tk.X)
        
        self.sync_status_var = tk.StringVar(value="Not connected to Supabase")
        ttk.Label(self.status_bar, textvariable=self.sync_status_var).pack(side=tk.LEFT, padx=5, pady=2)
        
        self.scan_count_var = tk.StringVar(value="Scans: 0")
        ttk.Label(self.status_bar, textvariable=self.scan_count_var).pack(side=tk.RIGHT, padx=5, pady=2)
        
    def start_camera(self):
        """Initialize the camera capture"""
        if self.vid is not None:
            self.vid.release()
        
        try:
            camera_index = int(self.camera_var.get())
            self.vid, width, height = self.scanner.get_camera_device(camera_index)
            logging.info(f"Camera {camera_index} started with resolution {width}x{height}")
        except Exception as e:
            messagebox.showerror("Camera Error", f"Failed to open camera: {str(e)}")
            logging.error(f"Camera error: {e}")
            self.vid = None
    
    def change_camera(self, event=None):
        """Handle camera change"""
        self.start_camera()
    
    def load_event_tickets(self):
        """Load ticket data for an event from Supabase"""
        event_id = self.event_id_var.get().strip()
        if not event_id:
            messagebox.showwarning("Warning", "Please enter an Event ID")
            return
        
        self.status_var.set("Loading tickets...")
        self.window.update()
        
        try:
            # Run in a separate thread to avoid freezing GUI
            threading.Thread(target=self._load_tickets_thread, args=(event_id,), daemon=True).start()
        except Exception as e:
            logging.error(f"Failed to load tickets: {e}")
            self.status_var.set("Failed to load tickets")
    
    def _load_tickets_thread(self, event_id):
        """Background thread for loading tickets"""
        try:
            tickets = self.supabase.preload_tickets(event_id)
            if tickets:
                self.db.preload_tickets(tickets)
                self.window.after(0, lambda: self.status_var.set(f"Loaded {len(tickets)} tickets"))
                self.window.after(0, lambda: self.sync_status_var.set(f"Connected to Supabase - Event: {event_id}"))
                logging.info(f"Loaded {len(tickets)} tickets for event {event_id}")
                self.current_event_id = event_id
            else:
                self.window.after(0, lambda: self.status_var.set("No tickets found"))
                logging.warning(f"No tickets found for event {event_id}")
        except Exception as e:
            logging.error(f"Error loading tickets: {e}")
            self.window.after(0, lambda: self.status_var.set("Error loading tickets"))
    
    def process_qr_code(self, qr_data):
        """Process scanned QR code data"""
        if self.processing_qr:
            return
        
        self.processing_qr = True
        try:
            logging.info(f"Processing QR code: {qr_data[:20]}...")
            
            # Use the enhanced verification system
            is_valid, result_data, message = self.scanner.verify_qr_code(qr_data)
            
            # Get the QR code value - might be in different places depending on format
            qr_code = result_data.get("qr_code", qr_data.strip())
            
            # Update UI with QR code
            self.ticket_id_var.set(qr_code[:30] + "..." if len(qr_code) > 30 else qr_code)
            
            # Handle attendee data display
            attendee_data = None
            
            # Check if attendee data is in the result
            if "attendee" in result_data:
                attendee = result_data["attendee"]
                event_id = attendee.get('event_id', '')
                attendee_name = attendee.get('attendee_name', '')
                attendee_email = attendee.get('attendee_email', '')
                
                # Update UI with attendee details
                self.event_id_result_var.set(event_id)
                self.issued_to_var.set(f"{attendee_name} ({attendee_email})")
            else:
                # Try to get from database
                cursor = self.db.conn.cursor()
                cursor.execute("SELECT * FROM booking_attendees WHERE qr_code=?", (qr_code,))
                attendee_data = cursor.fetchone()
                
                if attendee_data:
                    # Update UI with attendee details
                    self.event_id_result_var.set(attendee_data[1])  # event_id
                    self.issued_to_var.set(f"{attendee_data[3]} ({attendee_data[4]})")  # name and email
                else:
                    # No attendee data available
                    self.event_id_result_var.set("")
                    self.issued_to_var.set("Unknown")
            
            if is_valid:
                # Valid QR code - mark as checked in
                self.db.mark_attendee_checked_in(qr_code)
                self.db.add_scan_log(qr_code, config.SCANNER_ID)
                
                # Update scan count
                cursor = self.db.conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM scans_local")
                count = cursor.fetchone()[0]
                self.scan_count_var.set(f"Scans: {count}")
                
                # Show valid result
                self.show_valid_result(f"Valid QR code: {message}")
                
                # Try to sync immediately
                try:
                    self.supabase.push_scan(qr_code, config.SCANNER_ID)
                except Exception as e:
                    logging.warning(f"Couldn't push scan, will sync later: {e}")
            else:
                # Invalid QR code
                self.show_invalid_result(message)
        
        except Exception as e:
            logging.error(f"Error processing QR code: {e}")
            self.show_invalid_result(f"Error: {str(e)}")
        finally:
            self.processing_qr = False
    
    def show_valid_result(self, message):
        """
        Display valid ticket result
        
        Args:
            message: Message to display
        """
        self.ticket_status_var.set("VALID")
        self.ticket_status_label.configure(foreground="green")
        self.message_var.set(message)
        self.message_label.configure(foreground="green")
        
        # Flash green background
        self.result_frame.configure(style="Valid.TLabelframe")
        self.window.after(2000, lambda: self.result_frame.configure(style="TLabelframe"))
    
    def show_invalid_result(self, message):
        """
        Display invalid ticket result
        
        Args:
            message: Message to display
        """
        self.ticket_status_var.set("INVALID")
        self.ticket_status_label.configure(foreground="red")
        self.message_var.set(message)
        self.message_label.configure(foreground="red")
        
        # Flash red background
        self.result_frame.configure(style="Invalid.TLabelframe")
        self.window.after(2000, lambda: self.result_frame.configure(style="TLabelframe"))
    
    def sync_offline_scans(self):
        """Background thread to sync offline scan logs"""
        while True:
            try:
                # Get unsynced scans
                unsynced = self.db.get_unsynced_scans()
                
                for scan_id, qr_code, scanner_id, scanned_at in unsynced:
                    # Push to Supabase
                    success = self.supabase.push_scan(qr_code, scanner_id)
                    if success:
                        # Mark as synced
                        self.db.mark_scan_synced(scan_id)
                        logging.info(f"Synced scan {scan_id} for QR code {qr_code}")
                    else:
                        logging.warning(f"Failed to sync scan {scan_id} for QR code {qr_code}")
            except Exception as e:
                logging.error(f"Sync error: {e}")
            
            # Sleep for 30 seconds before next sync attempt
            time.sleep(30)
    
    def poll_for_ticket_updates(self):
        """Poll for ticket updates as an alternative to realtime subscriptions"""
        poll_interval = 10  # seconds
        while True:
            try:
                if self.current_event_id:
                    # Fetch latest tickets for the current event
                    tickets = self.supabase.preload_tickets(self.current_event_id)
                    if tickets:
                        self.db.preload_tickets(tickets)
                        logging.debug(f"Polled and updated {len(tickets)} tickets for event {self.current_event_id}")
            except Exception as e:
                logging.error(f"Error polling for ticket updates: {e}")
            
            time.sleep(poll_interval)
    
    def update(self):
        """Update the video frame and process QR codes"""
        if self.vid is not None and self.vid.isOpened():
            ret, frame = self.vid.read()
            if ret:
                # Process frame for QR codes
                qr_data = self.scanner.scan_image(frame)
                
                if qr_data:
                    # Draw rectangle around QR code if found
                    barcodes = pyzbar.decode(frame)
                    for barcode in barcodes:
                        (x, y, w, h) = barcode.rect
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    
                    # Process the QR code
                    self.process_qr_code(qr_data)
                
                # Convert to RGB for tkinter
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Resize to fit canvas
                canvas_width = self.canvas.winfo_width()
                canvas_height = self.canvas.winfo_height()
                
                if canvas_width > 1 and canvas_height > 1:  # Ensure canvas has valid dimensions
                    # Calculate aspect ratio
                    aspect_ratio = frame.shape[1] / frame.shape[0]
                    
                    # Determine new dimensions to maintain aspect ratio
                    if canvas_width / canvas_height > aspect_ratio:
                        # Canvas is wider than needed
                        new_width = int(canvas_height * aspect_ratio)
                        new_height = canvas_height
                    else:
                        # Canvas is taller than needed
                        new_width = canvas_width
                        new_height = int(canvas_width / aspect_ratio)
                    
                    # Resize frame
                    frame_resized = cv2.resize(frame_rgb, (new_width, new_height))
                    
                    # Convert to ImageTk format
                    self.photo = PIL.ImageTk.PhotoImage(image=PIL.Image.fromarray(frame_resized))
                    
                    # Update canvas
                    self.canvas.create_image(canvas_width/2, canvas_height/2, image=self.photo, anchor=tk.CENTER)
        
        # Schedule the next update
        self.window.after(15, self.update)  # ~60 fps
    
    def run(self):
        """Run the application"""
        self.window.mainloop()
    
    def __del__(self):
        """Clean up resources"""
        if self.vid is not None and self.vid.isOpened():
            self.vid.release()


# Create custom styles
def setup_styles():
    """Set up custom styles for the application"""
    style = ttk.Style()
    style.configure("Valid.TLabelframe", background="light green")
    style.configure("Invalid.TLabelframe", background="light coral")

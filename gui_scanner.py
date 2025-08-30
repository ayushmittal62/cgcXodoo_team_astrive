"""
EventHive GUI QR Scanner
A graphical QR code scanner for event check-in with Supabase integration
"""

import cv2
import tkinter as tk
from tkinter import ttk, messagebox
import PIL.Image, PIL.ImageTk
import time
import threading
import json
from pyzbar import pyzbar
import hmac
import hashlib
import logging
import os
from datetime import datetime

# Local imports
from db_manager import DBManager
from supabase_client import SupabaseClient
import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler("scanner.log"), logging.StreamHandler()]
)

class QRScannerApp:
    def __init__(self, window, window_title):
        # Initialize the window
        self.window = window
        self.window.title(window_title)
        self.window.resizable(width=True, height=True)
        self.window.configure(bg="#f0f0f0")
        
        # Set window size and position
        window_width = 800
        window_height = 600
        screen_width = self.window.winfo_screenwidth()
        screen_height = self.window.winfo_screenheight()
        center_x = int(screen_width/2 - window_width/2)
        center_y = int(screen_height/2 - window_height/2)
        self.window.geometry(f'{window_width}x{window_height}+{center_x}+{center_y}')
        
        # Initialize database and Supabase client
        self.db = DBManager(config.DB_PATH)
        self.supabase = SupabaseClient(config.SUPABASE_URL, config.SUPABASE_KEY)
        
        # Video capture
        self.vid = None  # Will be initialized later
        self.camera_index = 0  # Default camera
        
        # Create GUI elements
        self.create_widgets()
        
        # Status variables
        self.last_scan_time = 0
        self.scan_cooldown = 2  # Seconds between scans to prevent duplicates
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
        self.window.mainloop()
    
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
        self.camera_var = tk.StringVar(value="0")
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
        
        # Ticket ID
        ttk.Label(self.result_grid, text="Ticket ID:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.ticket_id_var = tk.StringVar()
        ttk.Label(self.result_grid, textvariable=self.ticket_id_var, font=("Arial", 10, "bold")).grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Event ID
        ttk.Label(self.result_grid, text="Event ID:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.event_id_result_var = tk.StringVar()
        ttk.Label(self.result_grid, textvariable=self.event_id_result_var).grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Issued To
        ttk.Label(self.result_grid, text="Issued To:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
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
            self.vid = cv2.VideoCapture(camera_index)
            if not self.vid.isOpened():
                raise ValueError(f"Unable to open camera {camera_index}")
            
            # Get video dimensions
            self.width = self.vid.get(cv2.CAP_PROP_FRAME_WIDTH)
            self.height = self.vid.get(cv2.CAP_PROP_FRAME_HEIGHT)
            logging.info(f"Camera {camera_index} started with resolution {self.width}x{self.height}")
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
    
    def verify_signature(self, payload, secret_key):
        """Verify the HMAC-SHA256 signature of the payload"""
        try:
            data = f"{payload['ticket_id']}|{payload['event_id']}"
            signature = payload['signature']
            hmac_obj = hmac.new(secret_key.encode(), data.encode(), hashlib.sha256)
            expected_sig = hmac_obj.hexdigest()
            return hmac.compare_digest(signature, expected_sig)
        except Exception as e:
            logging.error(f"Signature verification error: {e}")
            return False
    
    def process_qr_code(self, qr_data):
        """Process scanned QR code data"""
        # Check cooldown to avoid multiple scans
        current_time = time.time()
        if current_time - self.last_scan_time < self.scan_cooldown:
            return
        
        self.last_scan_time = current_time
        
        if self.processing_qr:
            return
        
        self.processing_qr = True
        try:
            # For our new system, the QR code itself is the unique identifier
            qr_code = qr_data.strip()
            logging.info(f"Scanned QR code: {qr_code}")
            
            # Update UI with QR code
            self.ticket_id_var.set(qr_code)
            
            # First, check local database
            cursor = self.db.conn.cursor()
            cursor.execute("SELECT * FROM booking_attendees WHERE qr_code=?", (qr_code,))
            attendee_data = cursor.fetchone()
            
            if not attendee_data:
                # QR code not in local DB, try to fetch from Supabase
                attendee = self.supabase.get_attendee_by_qr(qr_code)
                if attendee:
                    # Add to local DB
                    self.db.preload_tickets([attendee])
                    attendee_data = (
                        attendee.get('id', ''), 
                        attendee.get('event_id', ''),
                        qr_code,
                        attendee.get('attendee_name', ''),
                        attendee.get('attendee_email', ''),
                        1 if attendee.get('checked_in') else 0,
                        attendee.get('checked_in_at', ''),
                        attendee.get('updated_at', '')
                    )
                else:
                    self.show_invalid_result("Invalid QR code. Attendee not found.")
                    return
            
            # Update UI with attendee details
            self.event_id_result_var.set(attendee_data[1])  # event_id
            self.issued_to_var.set(f"{attendee_data[3]} ({attendee_data[4]})")  # name and email
            
            # Check if attendee is already checked in
            if self.db.is_attendee_checked_in(qr_code):
                self.show_invalid_result("Attendee already checked in.")
                return
            
            # Valid QR code - mark as checked in
            self.db.mark_attendee_checked_in(qr_code)
            self.db.add_scan_log(qr_code, config.SCANNER_ID)
            
            # Update scan count
            cursor.execute("SELECT COUNT(*) FROM scans_local")
            count = cursor.fetchone()[0]
            self.scan_count_var.set(f"Scans: {count}")
            
            # Show valid result
            self.show_valid_result("Valid QR code. Entry granted.")
            
            # Try to sync immediately
            try:
                self.supabase.push_scan(qr_code, config.SCANNER_ID)
            except Exception as e:
                logging.warning(f"Couldn't push scan, will sync later: {e}")
        
        except Exception as e:
            logging.error(f"Error processing QR code: {e}")
            self.show_invalid_result(f"Error: {str(e)}")
        finally:
            self.processing_qr = False
    
    def show_valid_result(self, message):
        """Display valid ticket result"""
        self.ticket_status_var.set("VALID")
        self.ticket_status_label.configure(foreground="green")
        self.message_var.set(message)
        self.message_label.configure(foreground="green")
        
        # Play success sound (optional)
        # self.window.bell()
        
        # Flash green background
        self.result_frame.configure(style="Valid.TLabelframe")
        self.window.after(2000, lambda: self.result_frame.configure(style="TLabelframe"))
    
    def show_invalid_result(self, message):
        """Display invalid ticket result"""
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
    
    def handle_realtime_update(self, payload):
        """Handle realtime updates from Supabase"""
        try:
            logging.info(f"Received realtime update: {payload}")
            # Update local database with new ticket data
            if payload.get('new') and payload['new'].get('ticket_id'):
                ticket = payload['new']
                self.db.preload_tickets([ticket])
                logging.info(f"Updated local ticket data for {ticket['ticket_id']}")
        except Exception as e:
            logging.error(f"Error handling realtime update: {e}")
    
    def update(self):
        """Update the video frame and process QR codes"""
        if self.vid is not None and self.vid.isOpened():
            ret, frame = self.vid.read()
            if ret:
                # Process frame for QR codes
                barcodes = pyzbar.decode(frame)
                
                # Draw box around QR code
                for barcode in barcodes:
                    # Extract QR code data
                    qr_data = barcode.data.decode('utf-8')
                    
                    # Draw rectangle around the barcode
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
                    aspect_ratio = self.width / self.height
                    
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
    
    def __del__(self):
        """Clean up resources"""
        if self.vid is not None and self.vid.isOpened():
            self.vid.release()

# Create custom styles
def setup_styles():
    style = ttk.Style()
    style.configure("Valid.TLabelframe", background="light green")
    style.configure("Invalid.TLabelframe", background="light coral")

# Main entry point
if __name__ == "__main__":
    # Create the main window
    root = tk.Tk()
    setup_styles()
    app = QRScannerApp(root, "EventHive QR Scanner")

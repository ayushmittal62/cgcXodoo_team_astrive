"""
EventHive UI Components
This module provides UI components for the scanner application
"""

import tkinter as tk
from tkinter import ttk
import PIL.Image, PIL.ImageTk
import cv2
import logging
from typing import Tuple, Optional, Any, Dict

class ScanResultDisplay:
    """
    A UI component for displaying the result of a QR code scan
    """
    
    def __init__(self, parent_frame):
        """
        Initialize the component
        
        Args:
            parent_frame: The parent frame to place this component in
        """
        self.frame = ttk.LabelFrame(parent_frame, text="Scan Result", padding=10)
        self.frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Grid for details
        self.grid = ttk.Frame(self.frame)
        self.grid.pack(fill=tk.X, padx=5, pady=5)
        
        # QR Code
        ttk.Label(self.grid, text="QR Code:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.qr_code_var = tk.StringVar()
        ttk.Label(self.grid, textvariable=self.qr_code_var, font=("Arial", 10, "bold")).grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Event ID
        ttk.Label(self.grid, text="Event ID:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.event_id_var = tk.StringVar()
        ttk.Label(self.grid, textvariable=self.event_id_var).grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Attendee Info
        ttk.Label(self.grid, text="Attendee:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=2)
        self.attendee_var = tk.StringVar()
        ttk.Label(self.grid, textvariable=self.attendee_var).grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Status
        ttk.Label(self.grid, text="Status:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=2)
        self.status_var = tk.StringVar()
        self.status_label = ttk.Label(self.grid, textvariable=self.status_var, font=("Arial", 11, "bold"))
        self.status_label.grid(row=3, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Message
        ttk.Label(self.grid, text="Message:").grid(row=4, column=0, sticky=tk.W, padx=5, pady=2)
        self.message_var = tk.StringVar()
        self.message_label = ttk.Label(self.grid, textvariable=self.message_var)
        self.message_label.grid(row=4, column=1, sticky=tk.W, padx=5, pady=2)
    
    def show_valid_result(self, qr_code: str, event_id: str, attendee: str, message: str):
        """
        Display valid ticket result
        
        Args:
            qr_code: The QR code value
            event_id: The event ID
            attendee: The attendee name and email
            message: Message to display
        """
        self.qr_code_var.set(qr_code)
        self.event_id_var.set(event_id)
        self.attendee_var.set(attendee)
        self.status_var.set("VALID")
        self.status_label.configure(foreground="green")
        self.message_var.set(message)
        self.message_label.configure(foreground="green")
        
        # Flash green background
        self.frame.configure(style="Valid.TLabelframe")
        # Reset after 2 seconds
        self.frame.after(2000, lambda: self.frame.configure(style="TLabelframe"))
    
    def show_invalid_result(self, qr_code: str, message: str, event_id: str = "", attendee: str = ""):
        """
        Display invalid ticket result
        
        Args:
            qr_code: The QR code value
            message: Error message to display
            event_id: The event ID (optional)
            attendee: The attendee name and email (optional)
        """
        self.qr_code_var.set(qr_code)
        self.event_id_var.set(event_id)
        self.attendee_var.set(attendee)
        self.status_var.set("INVALID")
        self.status_label.configure(foreground="red")
        self.message_var.set(message)
        self.message_label.configure(foreground="red")
        
        # Flash red background
        self.frame.configure(style="Invalid.TLabelframe")
        # Reset after 2 seconds
        self.frame.after(2000, lambda: self.frame.configure(style="TLabelframe"))


class VideoDisplay:
    """
    A UI component for displaying the camera video feed
    """
    
    def __init__(self, parent_frame, width: int = 640, height: int = 480):
        """
        Initialize the video display
        
        Args:
            parent_frame: The parent frame to place this component in
            width: Initial width of the canvas
            height: Initial height of the canvas
        """
        self.frame = ttk.Frame(parent_frame, borderwidth=2, relief="groove")
        self.frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Canvas for video display
        self.canvas = tk.Canvas(self.frame, width=width, height=height, bg="black")
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # For storing the photo image
        self.photo = None
    
    def update_frame(self, frame, draw_rects: bool = True):
        """
        Update the displayed frame
        
        Args:
            frame: OpenCV frame (BGR format)
            draw_rects: Whether to draw rectangles around detected QR codes
        
        Returns:
            Canvas width and height
        """
        # Convert to RGB for tkinter
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Get current canvas dimensions
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        
        # Use initial dimensions if canvas hasn't been drawn yet
        if canvas_width <= 1:
            canvas_width = self.canvas.winfo_reqwidth()
        if canvas_height <= 1:
            canvas_height = self.canvas.winfo_reqheight()
        
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
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Update canvas
        self.canvas.create_image(canvas_width/2, canvas_height/2, image=self.photo, anchor=tk.CENTER)
        
        return canvas_width, canvas_height


class StatusBar:
    """
    A UI component for displaying status information at the bottom of the window
    """
    
    def __init__(self, parent_window):
        """
        Initialize the status bar
        
        Args:
            parent_window: The parent window to place this component in
        """
        self.frame = ttk.Frame(parent_window)
        self.frame.pack(side=tk.BOTTOM, fill=tk.X)
        ttk.Separator(self.frame, orient=tk.HORIZONTAL).pack(fill=tk.X)
        
        self.sync_status_var = tk.StringVar(value="Not connected to Supabase")
        ttk.Label(self.frame, textvariable=self.sync_status_var).pack(side=tk.LEFT, padx=5, pady=2)
        
        self.scan_count_var = tk.StringVar(value="Scans: 0")
        ttk.Label(self.frame, textvariable=self.scan_count_var).pack(side=tk.RIGHT, padx=5, pady=2)
    
    def update_sync_status(self, status: str):
        """Update the sync status text"""
        self.sync_status_var.set(status)
    
    def update_scan_count(self, count: int):
        """Update the scan count"""
        self.scan_count_var.set(f"Scans: {count}")


class ControlPanel:
    """
    A UI component for controlling the scanner application
    """
    
    def __init__(self, parent_frame, load_callback, camera_change_callback):
        """
        Initialize the control panel
        
        Args:
            parent_frame: The parent frame to place this component in
            load_callback: Function to call when load button is clicked
            camera_change_callback: Function to call when camera is changed
        """
        self.frame = ttk.Frame(parent_frame)
        self.frame.pack(fill=tk.X, pady=10)
        
        # Event selection
        ttk.Label(self.frame, text="Event ID:").pack(side=tk.LEFT, padx=5)
        self.event_id_var = tk.StringVar()
        self.event_id_entry = ttk.Entry(self.frame, textvariable=self.event_id_var, width=15)
        self.event_id_entry.pack(side=tk.LEFT, padx=5)
        
        # Load tickets button
        self.load_button = ttk.Button(self.frame, text="Load Tickets", command=load_callback)
        self.load_button.pack(side=tk.LEFT, padx=5)
        
        # Camera selection
        ttk.Label(self.frame, text="Camera:").pack(side=tk.LEFT, padx=5)
        self.camera_var = tk.StringVar(value="0")
        self.camera_combo = ttk.Combobox(self.frame, textvariable=self.camera_var, width=5, values=["0", "1", "2"])
        self.camera_combo.pack(side=tk.LEFT, padx=5)
        self.camera_combo.bind("<<ComboboxSelected>>", camera_change_callback)
        
        # Status label
        self.status_var = tk.StringVar(value="Ready to scan")
        self.status_label = ttk.Label(self.frame, textvariable=self.status_var, font=("Arial", 12))
        self.status_label.pack(side=tk.RIGHT, padx=10)
    
    def get_event_id(self) -> str:
        """Get the entered event ID"""
        return self.event_id_var.get().strip()
    
    def get_camera_index(self) -> int:
        """Get the selected camera index"""
        return int(self.camera_var.get())
    
    def update_status(self, status: str):
        """Update the status text"""
        self.status_var.set(status)

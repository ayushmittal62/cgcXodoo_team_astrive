"""
EventHive Utility Functions
This module provides utility functions for the QR scanner application
"""

import logging
import hashlib
import hmac
import json
import time
import os
from typing import Dict, Any, Optional, Tuple, List, Union

def generate_hmac_signature(message: str, secret_key: str) -> str:
    """
    Generate HMAC signature for message authentication
    
    Args:
        message: The message to sign
        secret_key: The secret key to use for signing
        
    Returns:
        Hex-encoded HMAC-SHA256 signature
    """
    key_bytes = secret_key.encode('utf-8')
    message_bytes = message.encode('utf-8')
    signature = hmac.new(key_bytes, message_bytes, hashlib.sha256).hexdigest()
    return signature


def verify_hmac_signature(message: str, signature: str, secret_key: str) -> bool:
    """
    Verify HMAC signature
    
    Args:
        message: The original message
        signature: The signature to verify
        secret_key: The secret key used for signing
        
    Returns:
        True if the signature is valid, False otherwise
    """
    key_bytes = secret_key.encode('utf-8')
    message_bytes = message.encode('utf-8')
    computed_signature = hmac.new(key_bytes, message_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_signature, signature)


def parse_qr_data(qr_data: str) -> Dict[str, Any]:
    """
    Parse QR code data
    
    Args:
        qr_data: The QR code data string
        
    Returns:
        Dictionary containing parsed data
        
    Raises:
        ValueError: If QR data is invalid or cannot be parsed
    """
    try:
        data = json.loads(qr_data)
        return data
    except json.JSONDecodeError:
        raise ValueError("Invalid QR code data format")


def setup_logging(log_dir: str = "logs", level: int = logging.INFO) -> None:
    """
    Set up logging configuration
    
    Args:
        log_dir: Directory to store log files
        level: Logging level
    """
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, f"scanner_{time.strftime('%Y%m%d')}.log")
    
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logging.info("Logging initialized")


def format_timestamp(timestamp: Optional[str]) -> str:
    """
    Format a timestamp string for display
    
    Args:
        timestamp: ISO format timestamp string or None
        
    Returns:
        Formatted timestamp string
    """
    if not timestamp:
        return "Not available"
    
    try:
        # Parse ISO format timestamp
        time_struct = time.strptime(timestamp.split('.')[0], "%Y-%m-%dT%H:%M:%S")
        return time.strftime("%Y-%m-%d %H:%M:%S", time_struct)
    except (ValueError, AttributeError):
        return str(timestamp)


def get_camera_devices() -> List[int]:
    """
    Get available camera devices
    
    Returns:
        List of available camera indices
    """
    import cv2
    
    available_cameras = []
    
    # Try camera indices from 0 to 2
    for i in range(3):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            available_cameras.append(i)
            cap.release()
    
    return available_cameras


def is_network_available() -> bool:
    """
    Check if network connection is available
    
    Returns:
        True if network is available, False otherwise
    """
    import socket
    
    try:
        # Try to connect to Supabase server
        socket.create_connection(("supabase.co", 443), timeout=2)
        return True
    except OSError:
        return False

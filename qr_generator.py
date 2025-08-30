"""
EventHive QR Generator
Generate test QR codes for debugging and testing the scanner
"""

import qrcode
import json
import hmac
import hashlib
import uuid
import os
from datetime import datetime

def generate_qr_code(ticket_id, event_id, hmac_secret, output_dir="test_qr_codes"):
    """Generate a QR code with ticket_id, event_id and valid signature"""
    # Create the data string for signing
    data_string = f"{ticket_id}|{event_id}"
    
    # Generate HMAC-SHA256 signature
    hmac_obj = hmac.new(hmac_secret.encode(), data_string.encode(), hashlib.sha256)
    signature = hmac_obj.hexdigest()
    
    # Create payload
    payload = {
        "ticket_id": ticket_id,
        "event_id": event_id,
        "signature": signature
    }
    
    # Convert payload to JSON
    json_payload = json.dumps(payload)
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json_payload)
    qr.make(fit=True)
    
    # Create an image from the QR Code
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Make sure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the image
    file_path = os.path.join(output_dir, f"qr_{ticket_id}_{event_id}.png")
    img.save(file_path)
    
    print(f"Generated QR code: {file_path}")
    print(f"Payload: {json_payload}")
    
    return file_path

if __name__ == "__main__":
    # Configuration
    HMAC_SECRET = "your_hmac_secret_here"  # Should match config.py
    
    # Generate test event and tickets
    event_id = "E" + uuid.uuid4().hex[:8].upper()
    
    # Generate multiple test QR codes
    for i in range(5):
        ticket_id = f"T{uuid.uuid4().hex[:8].upper()}"
        generate_qr_code(ticket_id, event_id, HMAC_SECRET)
    
    # Also generate an invalid signature test case
    ticket_id = f"T{uuid.uuid4().hex[:8].upper()}"
    payload = {
        "ticket_id": ticket_id,
        "event_id": event_id,
        "signature": "invalid_signature_for_testing"
    }
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json.dumps(payload))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    output_dir = "test_qr_codes"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"qr_{ticket_id}_{event_id}_INVALID.png")
    img.save(file_path)
    
    print(f"Generated INVALID QR code: {file_path}")

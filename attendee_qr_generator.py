"""
EventHive QR Generator
Generate test QR codes for the booking_attendees system
"""

import qrcode
import uuid
import os
from datetime import datetime
import json

def generate_qr_code(event_id, attendee_name, attendee_email, output_dir="test_qr_codes"):
    """Generate a QR code with a unique identifier"""
    
    # Generate a unique QR code
    qr_code = f"EH-{uuid.uuid4().hex[:8].upper()}"
    
    # Create QR code image
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_code)
    qr.make(fit=True)
    
    # Create an image from the QR Code
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Make sure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the image
    file_path = os.path.join(output_dir, f"{qr_code}.png")
    img.save(file_path)
    
    # Create JSON for Supabase import
    attendee_data = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "qr_code": qr_code,
        "attendee_name": attendee_name,
        "attendee_email": attendee_email,
        "checked_in": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    print(f"Generated QR code: {file_path}")
    print(f"QR code value: {qr_code}")
    print(f"Attendee data: {attendee_data}")
    
    return qr_code, attendee_data

if __name__ == "__main__":
    # Configuration
    EVENT_ID = "EVENT-" + uuid.uuid4().hex[:8].upper()
    
    # Generate test attendees
    attendees = [
        {"name": "John Doe", "email": "john.doe@example.com"},
        {"name": "Jane Smith", "email": "jane.smith@example.com"},
        {"name": "Amit Patel", "email": "amit.patel@example.com"},
        {"name": "Priya Sharma", "email": "priya.sharma@example.com"},
        {"name": "David Wang", "email": "david.wang@example.com"}
    ]
    
    # Generate QR codes for all attendees
    all_attendee_data = []
    for attendee in attendees:
        _, data = generate_qr_code(EVENT_ID, attendee["name"], attendee["email"])
        all_attendee_data.append(data)
    
    # Save all attendee data to a JSON file for import into Supabase
    with open("test_qr_codes/attendees_data.json", "w") as f:
        json.dump(all_attendee_data, f, indent=2)
    
    print(f"\nGenerated {len(all_attendee_data)} attendees for event {EVENT_ID}")
    print(f"Event data saved to test_qr_codes/attendees_data.json")

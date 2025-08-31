"""
Email Automation Service for EventHive Bookings
Sends confirmation emails to users with email_status = pending using Brevo SMTP
Includes event details and QR code from booking_attendees table
"""

import os
import smtplib
import json
import time
import base64
import requests
from io import BytesIO
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime
from typing import Optional, List
from supabase import create_client, Client
from dotenv import load_dotenv
from PIL import Image

# Load environment variables - try .env.local first (Next.js convention), then .env
load_dotenv(dotenv_path="../.env.local")  # Try Next.js .env.local first
load_dotenv()  # Fallback to .env

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing Supabase environment variables!")
    print(f"SUPABASE_URL: {'✅' if SUPABASE_URL else '❌ Missing'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'✅' if SUPABASE_SERVICE_ROLE_KEY else '❌ Missing'}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Email configuration - Brevo SMTP
BREVO_SMTP_SERVER = os.environ.get("BREVO_SMTP_SERVER")
BREVO_SMTP_PORT = int(os.environ.get("BREVO_SMTP_PORT", 587))
BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.environ.get("BREVO_SENDER_NAME")
# Optional explicit SMTP login/password (recommended by Brevo: login is your SMTP login, password is your SMTP key)
BREVO_SMTP_LOGIN = os.environ.get("BREVO_SMTP_LOGIN") or BREVO_SENDER_EMAIL
BREVO_SMTP_PASSWORD = os.environ.get("BREVO_SMTP_PASSWORD") or BREVO_API_KEY

# Build ordered SMTP credential attempts for Brevo
def _build_brevo_credentials():
    attempts = []
    # 1) Explicit login + password
    if BREVO_SMTP_LOGIN and BREVO_SMTP_PASSWORD:
        attempts.append((BREVO_SMTP_LOGIN, BREVO_SMTP_PASSWORD, "BREVO_SMTP_LOGIN/BREVO_SMTP_PASSWORD"))
    # 2) Explicit login + API key
    if BREVO_SMTP_LOGIN and BREVO_API_KEY:
        attempts.append((BREVO_SMTP_LOGIN, BREVO_API_KEY, "BREVO_SMTP_LOGIN/BREVO_API_KEY"))
    # 3) Sender email as login + explicit password
    if BREVO_SENDER_EMAIL and BREVO_SMTP_PASSWORD:
        attempts.append((BREVO_SENDER_EMAIL, BREVO_SMTP_PASSWORD, "BREVO_SENDER_EMAIL/BREVO_SMTP_PASSWORD"))
    # 4) Sender email as login + API key (common Brevo setup)
    if BREVO_SENDER_EMAIL and BREVO_API_KEY:
        attempts.append((BREVO_SENDER_EMAIL, BREVO_API_KEY, "BREVO_SENDER_EMAIL/BREVO_API_KEY"))

    # De-dup while preserving order
    unique = []
    seen = set()
    for u, p, label in attempts:
        key = f"{u}|{p}"
        if key not in seen:
            unique.append((u, p, label))
            seen.add(key)
    return unique

def _brevo_server_attempts():
    # Try STARTTLS on configured port, then fallback to SSL on 465
    return [
        ("STARTTLS", BREVO_SMTP_SERVER or "smtp-relay.brevo.com", BREVO_SMTP_PORT or 587),
        ("SSL", BREVO_SMTP_SERVER or "smtp-relay.brevo.com", 465),
    ]

def download_qr_image(qr_image_url: str) -> BytesIO:
    """Download QR image from URL or convert from data URL and return as BytesIO"""
    try:
        print(f"🔗 Processing QR image: {qr_image_url[:50]}...")
        
        # Check if it's a data URL
        if qr_image_url.startswith('data:image/'):
            print("📊 Processing data URL QR code...")
            # Extract base64 data from data URL
            header, encoded = qr_image_url.split(',', 1)
            image_data = base64.b64decode(encoded)
            
            # Convert to PIL Image and back to BytesIO to ensure compatibility
            img = Image.open(BytesIO(image_data))
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            print("✅ Data URL QR image processed successfully")
            return img_buffer
        else:
            # Handle regular URLs
            print(f"🌐 Downloading QR image from URL...")
            response = requests.get(qr_image_url, timeout=10)
            response.raise_for_status()
            
            # Convert to PIL Image and back to BytesIO to ensure compatibility
            img = Image.open(BytesIO(response.content))
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            print("✅ QR image downloaded successfully")
            return img_buffer
            
    except Exception as e:
        print(f"❌ Error processing QR image: {str(e)}")
        raise

def create_email_html(booking_data, event_data, user_data, attendee_data, has_qr=True):
    """Create HTML email content with event details"""
    attendee_names = ", ".join([att['name'] for att in attendee_data])
    
    # QR code section - only include if QR is available
    qr_section = ""
    if has_qr:
        qr_section = f"""
            <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Your Event Ticket(s)</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px;">Present this QR code at the event entrance</p>
                <img src="cid:qr_code" alt="QR Code" style="border: 2px solid #bdc3c7; border-radius: 8px; padding: 10px; background-color: white; max-width: 300px;">
            </div>
        """
    else:
        qr_section = f"""
            <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Your Event Tickets</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px;">Your booking is confirmed! QR codes will be available soon.</p>
                <div style="padding: 20px; border: 2px dashed #bdc3c7; border-radius: 8px; background-color: #f8f9fa;">
                    <p style="color: #6c757d; margin: 0;">🎫 Ticket QR codes are being generated and will be available shortly</p>
                </div>
            </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Event Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0;">🎉 Booking Confirmed!</h1>
                <p style="color: #7f8c8d; font-size: 16px;">Your event tickets are ready</p>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #34495e; margin-top: 0;">Event Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Event:</td>
                        <td style="padding: 8px 0; color: #34495e;">{event_data.get('title', 'Event')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Description:</td>
                        <td style="padding: 8px 0; color: #34495e;">{event_data.get('description', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Date:</td>
                        <td style="padding: 8px 0; color: #34495e;">{event_data.get('event_date', 'TBA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Time:</td>
                        <td style="padding: 8px 0; color: #34495e;">{event_data.get('event_time', 'TBA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Venue:</td>
                        <td style="padding: 8px 0; color: #34495e;">{event_data.get('location', 'TBA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Price:</td>
                        <td style="padding: 8px 0; color: #34495e;">₹{booking_data['total_amount']}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #27ae60; margin-top: 0;">Booking Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Booking ID:</td>
                        <td style="padding: 8px 0; color: #34495e; font-family: monospace;">{booking_data['id']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Booked By:</td>
                        <td style="padding: 8px 0; color: #34495e;">{user_data.get('name', '')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Email:</td>
                        <td style="padding: 8px 0; color: #34495e;">{user_data['email']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Attendees:</td>
                        <td style="padding: 8px 0; color: #34495e;">{attendee_names}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Number of Tickets:</td>
                        <td style="padding: 8px 0; color: #34495e;">{len(attendee_data)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Status:</td>
                        <td style="padding: 8px 0; color: #27ae60; font-weight: bold;">✅ {booking_data['booking_status'].upper()}</td>
                    </tr>
                </table>
            </div>
            
            {qr_section}
            
            <div style="background-color: #ffeaa7; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; color: #2d3436; text-align: center;">
                    <strong>📱 Save this email for easy access to your booking details!</strong>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                <p style="color: #95a5a6; font-size: 14px; margin: 0;">
                    Thank you for booking with EventHive! 🎊<br>
                    For any queries, please contact event organizers.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_email_with_qr(to_email: str, subject: str, html_content: str, qr_image_buffer: Optional[BytesIO], user_name: str):
    """Send email with optional QR code attachment using SMTP"""
    try:
        print(f"\n📧 === EMAIL SENDING PROCESS ===")
        print(f"📤 Sender Email: {BREVO_SENDER_EMAIL}")
        print(f"📥 Recipient Email: {to_email}")
        print(f"👤 Recipient Name: {user_name}")
        print(f"📝 Subject: {subject}")
        print(f"🎫 QR Image: {'Included' if qr_image_buffer else 'Not available'}")
        
        # Create message
        msg = MIMEMultipart('related')
        msg['From'] = f"{BREVO_SENDER_NAME} <{BREVO_SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))
        
        # Attach QR code image if available
        if qr_image_buffer:
            qr_image = MIMEImage(qr_image_buffer.read())
            qr_image.add_header('Content-ID', '<qr_code>')
            qr_image.add_header('Content-Disposition', 'inline', filename='qr_code.png')
            msg.attach(qr_image)
            print(f"📦 Email message prepared with HTML content and QR code attachment")
        else:
            print(f"📦 Email message prepared with HTML content only (no QR code)")
        
        # Connect to Brevo SMTP server with retry logic and multiple credential/transport attempts
        max_retries = 2
        cred_attempts = _build_brevo_credentials()
        server_attempts = _brevo_server_attempts()

        if not cred_attempts:
            raise RuntimeError("Brevo SMTP credentials are not configured. Set BREVO_SMTP_LOGIN and BREVO_SMTP_PASSWORD or BREVO_API_KEY in .env")

        for attempt in range(max_retries):
            print(f"\n🔌 SMTP Connection Attempt {attempt + 1}/{max_retries}")
            last_error: Optional[Exception] = None
            for transport, host, port in server_attempts:
                for login_user, login_pass, label in cred_attempts:
                    try:
                        print(f"🌐 Trying {transport} {host}:{port} with creds [{label}] (user: {login_user})")
                        if transport == "SSL":
                            server = smtplib.SMTP_SSL(host, port)
                        else:
                            server = smtplib.SMTP(host, port)
                            server.ehlo()
                            print("🔒 Starting TLS encryption...")
                            server.starttls()
                            server.ehlo()

                        print("🔐 Authenticating with Brevo...")
                        server.login(login_user, login_pass)
                        print("✅ Brevo authentication successful!")

                        print("📮 Sending email...")
                        text = msg.as_string()
                        server.sendmail(BREVO_SENDER_EMAIL, to_email, text)
                        server.quit()
                        print(f"✅ Email sent successfully to {to_email}")
                        return True

                    except smtplib.SMTPAuthenticationError as e:
                        last_error = e
                        print(f"❌ Auth failed for creds [{label}] on {transport} {host}:{port}: {e}")
                        try:
                            server.quit()
                        except Exception:
                            pass
                        continue
                    except Exception as e:
                        last_error = e
                        print(f"❌ SMTP error on {transport} {host}:{port}: {e}")
                        try:
                            server.quit()
                        except Exception:
                            pass
                        continue

            if attempt < max_retries - 1:
                backoff = 2 ** attempt
                print(f"⏳ Retrying after {backoff}s...")
                time.sleep(backoff)
            else:
                if last_error:
                    raise last_error
                raise RuntimeError("SMTP attempts exhausted without specific error")
                    
    except Exception as e:
        print(f"❌ Email sending failed: {str(e)}")
        raise

def process_booking_email(booking_id: str, force_send: bool = False):
    """Process and send booking confirmation email"""
    try:
        print(f"\n🎯 === PROCESSING BOOKING EMAIL ===")
        print(f"📋 Booking ID: {booking_id}")
        print(f"🔄 Force Send: {force_send}")
        
        # Fetch booking details
        print(f"\n📊 Fetching booking details from database...")
        booking_response = supabase.table("bookings").select("*").eq("id", booking_id).execute()
        
        if not booking_response.data:
            print(f"❌ Booking not found: {booking_id}")
            return {"error": f"Booking not found: {booking_id}"}
        
        booking_data = booking_response.data[0]
        print(f"✅ Booking data retrieved:")
        print(f"   � User ID: {booking_data['user_id']}")
        print(f"   🎫 Event ID: {booking_data['event_id']}")
        print(f"   📋 Booking Status: {booking_data['booking_status']}")
        print(f"   � Email Status: {booking_data.get('email_status', 'N/A')}")
        print(f"   � Total Amount: ₹{booking_data['total_amount']}")
        print(f"   🎟️ Quantity: {booking_data['quantity']}")
        
        # Check if email should be sent
        if not force_send:
            if booking_data.get('email_status') != 'pending':
                print(f"⏭️  Skipping email - Email Status: {booking_data.get('email_status')}")
                return {"message": "Email already sent or not pending", "booking_id": booking_id}
        
        # Fetch event details
        print(f"\n🎪 Fetching event details...")
        event_response = supabase.table("events").select("*").eq("id", booking_data['event_id']).execute()
        
        if not event_response.data:
            print(f"❌ Event not found: {booking_data['event_id']}")
            return {"error": f"Event not found: {booking_data['event_id']}"}
        
        event_data = event_response.data[0]
        print(f"✅ Event data retrieved:")
        print(f"   🎪 Event Title: {event_data.get('title', 'Event')}")
        print(f"   📅 Event Date: {event_data.get('event_date', 'TBA')}")
        print(f"   ⏰ Event Time: {event_data.get('event_time', 'TBA')}")
        print(f"   📍 Event Location: {event_data.get('location', 'TBA')}")
        print(f"   📝 Description: {event_data.get('description', 'N/A')}")
        print(f"   🎫 Total Tickets: {event_data.get('total_tickets', 'N/A')}")
        
        # Fetch user details using user_id
        print(f"\n👤 Fetching user details...")
        user_response = supabase.table("users").select("*").eq("id", booking_data['user_id']).execute()
        
        if not user_response.data:
            print(f"❌ User not found: {booking_data['user_id']}")
            return {"error": f"User not found: {booking_data['user_id']}"}
        
        user_data = user_response.data[0]
        print(f"✅ User data retrieved:")
        print(f"   👤 Name: {user_data.get('name', '')}")
        print(f"   📧 Email: {user_data['email']}")
        print(f"   � Phone: {user_data.get('phone', 'N/A')}")
        
        # Fetch booking attendees with QR image URLs
        print(f"\n👥 Fetching booking attendees and QR codes...")
        attendees_response = supabase.table("booking_attendees").select("*").eq("booking_id", booking_id).execute()
        
        if not attendees_response.data:
            print(f"⚠️  No attendees found for booking: {booking_id}")
            print(f"📋 Creating default attendee entry for email...")
            # Create default attendee data using user information
            attendee_data = [{
                "name": user_data.get('name', 'Guest'),
                "email": user_data['email'],
                "phone": user_data.get('phone', ''),
                "qr_image_url": None  # We'll generate a QR or skip QR for now
            }]
        else:
            attendee_data = attendees_response.data
        print(f"✅ Found {len(attendee_data)} attendees:")
        for i, attendee in enumerate(attendee_data):
            print(f"   {i+1}. {attendee.get('name', '')} - Email: {attendee.get('email', '')} - QR: {attendee.get('qr_image_url', 'N/A')}")
        
        # Get QR image from first attendee
        qr_image_url = attendee_data[0].get('qr_image_url')
        if qr_image_url:
            print(f"\n🎫 Downloading QR image from Supabase bucket...")
            qr_image_buffer = download_qr_image(qr_image_url)
        else:
            print(f"\n⚠️  No QR image URL found, email will be sent without QR code")
            qr_image_buffer = None
        
        # Create email content
        print(f"\n📝 Creating email content...")
        event_title = event_data.get('title', 'Event')
        subject = f"🎉 Booking Confirmed - {event_title}"
        html_content = create_email_html(booking_data, event_data, user_data, attendee_data, has_qr=qr_image_buffer is not None)
        user_name = user_data.get('name', '').strip()
        
        # Send email
        print(f"\n📧 Initiating email send...")
        send_email_with_qr(
            to_email=user_data['email'],
            subject=subject,
            html_content=html_content,
            qr_image_buffer=qr_image_buffer,
            user_name=user_name
        )
        
        # Update email status
        print(f"\n💾 Updating booking email status...")
        update_data = {
            "email_status": "sent",
            "tickets_emailed_at": datetime.now().isoformat()
        }
        
        supabase.table("bookings").update(update_data).eq("id", booking_id).execute()
        print(f"✅ Email status updated to 'sent'")
        
        print(f"\n🎉 === EMAIL PROCESS COMPLETED SUCCESSFULLY ===")
        return {
            "message": "Email sent successfully",
            "booking_id": booking_id,
            "recipient": user_data['email'],
            "event": event_title,
            "attendees_count": len(attendee_data)
        }
        
    except Exception as e:
        error_msg = f"Error processing booking email: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}

def process_all_pending_emails():
    """Process all bookings with email_status = pending"""
    try:
        print(f"\n🚀 === PROCESSING ALL PENDING EMAILS ===")
        
        # Fetch all bookings with email_status = pending
        pending_response = supabase.table("bookings").select("*").eq("email_status", "pending").execute()
        
        if not pending_response.data:
            print("📭 No pending emails found")
            return {"message": "No pending emails found", "processed": 0}
        
        pending_bookings = pending_response.data
        print(f"📋 Found {len(pending_bookings)} pending bookings to process")
        
        results = []
        success_count = 0
        
        for booking in pending_bookings:
            booking_id = booking['id']
            user_id = booking['user_id']
            
            print(f"\n📧 Processing booking {booking_id} for user {user_id}")
            
            result = process_booking_email(booking_id, force_send=False)
            results.append({
                "booking_id": booking_id,
                "user_id": user_id,
                "result": result
            })
            
            if "error" not in result:
                success_count += 1
                print(f"✅ Success for {booking_id}")
            else:
                print(f"❌ Failed for {booking_id}: {result['error']}")
            
            # Small delay between emails to avoid rate limiting
            time.sleep(2)
        
        print(f"\n📊 === BATCH PROCESSING COMPLETED ===")
        print(f"✅ Successfully sent: {success_count}")
        print(f"❌ Failed: {len(pending_bookings) - success_count}")
        
        return {
            "message": f"Processed {len(pending_bookings)} bookings",
            "success_count": success_count,
            "failed_count": len(pending_bookings) - success_count,
            "details": results
        }
        
    except Exception as e:
        error_msg = f"Error processing batch emails: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}

def test_email_configuration():
    """Test email configuration"""
    try:
        print("\n🧪 === TESTING EMAIL CONFIGURATION ===")
        print(f"📧 Sender Email: {BREVO_SENDER_EMAIL}")
        print(f"👤 SMTP Login: {BREVO_SMTP_LOGIN}")
        print(f"🔑 SMTP Password: {'*' * len(BREVO_SMTP_PASSWORD) if BREVO_SMTP_PASSWORD else 'NOT SET'}")
        print(f"🌐 SMTP Server: {BREVO_SMTP_SERVER}:{BREVO_SMTP_PORT}")
        print(f"🗄️ Supabase URL: {SUPABASE_URL}")
        print(f"🔐 Supabase Key: {'*' * 20 if SUPABASE_SERVICE_ROLE_KEY else 'NOT SET'}")

        # Test Supabase connection
        print("\n🔌 Testing Supabase connection...")
        _ = supabase.table("bookings").select("id").limit(1).execute()
        print("✅ Supabase connection successful")

        # Test Brevo connection with multiple attempts
        print("\n📧 Testing Brevo SMTP connection...")
        cred_attempts = _build_brevo_credentials()
        server_attempts = _brevo_server_attempts()

        if not cred_attempts:
            raise RuntimeError("Brevo SMTP credentials are not configured. Set BREVO_SMTP_LOGIN and BREVO_SMTP_PASSWORD or BREVO_API_KEY in .env")

        connected = False
        last_error = None
        for transport, host, port in server_attempts:
            for login_user, login_pass, label in cred_attempts:
                try:
                    print(f"🌐 Trying {transport} {host}:{port} with creds [{label}] (user: {login_user})")
                    if transport == "SSL":
                        server = smtplib.SMTP_SSL(host, port)
                    else:
                        server = smtplib.SMTP(host, port)
                        server.ehlo()
                        print("🔒 Starting TLS encryption...")
                        server.starttls()
                        server.ehlo()
                    server.login(login_user, login_pass)
                    server.quit()
                    connected = True
                    print("✅ Brevo SMTP connection successful")
                    break
                except Exception as e:
                    last_error = e
                    print(f"❌ Connection/auth failed for [{label}] on {transport} {host}:{port}: {e}")
                    try:
                        server.quit()
                    except Exception:
                        pass
                    continue
            if connected:
                break
        if not connected:
            raise last_error or RuntimeError("Unable to connect to Brevo SMTP with provided credentials")

        return {"message": "All configurations are working correctly"}

    except Exception as e:
        error_msg = f"Configuration test failed: {str(e)}"
        print(f"❌ {error_msg}")
        return {"error": error_msg}

# CLI interface for testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) == 1:
        print("📋 Available commands:")
        print("  python email_automation.py test                     - Test email configuration")
        print("  python email_automation.py all                      - Process all pending emails")
        print("  python email_automation.py <booking_id>             - Process specific booking")
        print("  python email_automation.py <booking_id> force       - Force send email for booking")
        print("\nExample:")
        print("  python email_automation.py 48efd469-2b44-4a6c-87fc-8c6f56899bc3")

    elif sys.argv[1] == "test":
        print("🚀 Testing email configuration...")
        result = test_email_configuration()
        print(f"\n📊 Result: {result}")

    elif sys.argv[1] == "all":
        print("🚀 Processing all pending emails...")
        result = process_all_pending_emails()
        print(f"\n📊 Result: {result}")

    else:
        booking_id = sys.argv[1]
        force_send = len(sys.argv) > 2 and sys.argv[2].lower() == "force"

        print(f"🚀 Processing email for booking: {booking_id}")
        result = process_booking_email(booking_id, force_send)
        print(f"\n📊 Result: {result}")

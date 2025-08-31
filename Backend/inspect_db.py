"""
Database Inspector for EventHive
Check the structure of bookings, events, users, and booking_attendees tables
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def inspect_table(table_name, limit=3):
    """Inspect table structure and sample data"""
    try:
        print(f"\n📋 === {table_name.upper()} TABLE ===")
        response = supabase.table(table_name).select("*").limit(limit).execute()
        
        if response.data:
            print(f"Found {len(response.data)} records")
            for i, record in enumerate(response.data):
                print(f"\nRecord {i+1}:")
                print(json.dumps(record, indent=2, default=str))
        else:
            print("No records found")
            
    except Exception as e:
        print(f"❌ Error inspecting {table_name}: {e}")

def search_booking(booking_id):
    """Search for specific booking"""
    try:
        print(f"\n🔍 === SEARCHING FOR BOOKING {booking_id} ===")
        response = supabase.table("bookings").select("*").eq("id", booking_id).execute()
        
        if response.data:
            print("✅ Booking found:")
            print(json.dumps(response.data[0], indent=2, default=str))
            return response.data[0]
        else:
            print("❌ Booking not found")
            return None
            
    except Exception as e:
        print(f"❌ Error searching booking: {e}")
        return None

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        booking_id = sys.argv[1]
        booking = search_booking(booking_id)
        
        if booking:
            # Check for attendees
            try:
                print(f"\n👥 === ATTENDEES FOR BOOKING {booking_id} ===")
                attendees_response = supabase.table("booking_attendees").select("*").eq("booking_id", booking_id).execute()
                if attendees_response.data:
                    print(f"Found {len(attendees_response.data)} attendees:")
                    for attendee in attendees_response.data:
                        print(json.dumps(attendee, indent=2, default=str))
                else:
                    print("No attendees found")
            except Exception as e:
                print(f"❌ Error fetching attendees: {e}")
    else:
        print("🔍 Inspecting database tables...")
        inspect_table("bookings")
        inspect_table("events") 
        inspect_table("users")
        inspect_table("booking_attendees")
        
        print("\nUsage: python inspect_db.py <booking_id> - to inspect specific booking")

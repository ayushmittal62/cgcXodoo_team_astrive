# EventHive - Supabase Integration

## Overview

EventHive has been successfully migrated from mock data to a fully functional Supabase backend. The application now dynamically fetches event data, handles user registrations, processes bookings, and manages attendee information through a PostgreSQL database.

## What's Changed

### 🗄️ Database Integration
- **Replaced** mock data with live Supabase database
- **Added** comprehensive database schema with 11+ tables
- **Implemented** proper relationships between events, users, bookings, and attendees

### 🔧 New Features
- **Dynamic Event Loading**: Events are now fetched from Supabase in real-time
- **Database Booking System**: Bookings are stored in the database with proper validation
- **Attendee Management**: Complete attendee information tracking with QR codes
- **Payment Integration**: Basic payment tracking system
- **Event Analytics**: Foundation for tracking event performance

### 📊 Database Schema
The application now uses the following key tables:
- `users` - User accounts and profiles
- `organizers` - Event organizer information with KYC
- `events` - Event details and metadata
- `tickets` - Ticket types and pricing
- `bookings` - Booking records and status
- `booking_attendees` - Individual attendee details
- `payments` - Payment transactions
- `notifications` - User notifications
- `feedbacks` - Event feedback system

## Setup Instructions

### 1. Environment Configuration
Ensure your `.env.local` file has the correct Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
The database schema should already be set up in your Supabase project. If you need to recreate it, use the SQL schema provided in your requirements.

### 3. Existing Data
Your Supabase database already contains event data that the application will automatically fetch and display. The system currently shows:
- 3 published events (Aurora Night Music Fest, Bollywood Night Concert, Blood Donation Drive)
- Multiple ticket types for each event
- Proper organizer relationships

No additional data setup is required - the application connects directly to your existing Supabase data!

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000/attendee` to see your existing events loaded directly from your Supabase database.

## Key Components

### 🏗️ Architecture
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **State Management**: SWR for data fetching

### 📁 New Files
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/events-service.ts` - Database service functions

### 🔄 Updated Files
- `src/app/attendee/page.tsx` - Now fetches events from Supabase
- `src/app/events/[id]/page.tsx` - Dynamic event details from database
- `src/app/events/[id]/book/page.tsx` - Database-powered booking system
- `src/components/event-card.tsx` - Updated for new data structure

## Features

### 🎫 Event Management
- **Real-time Data**: Events load dynamically from Supabase
- **Status Tracking**: Automatic status updates (ongoing, published, completed)
- **Category Filtering**: Dynamic category filters based on actual data
- **Search Functionality**: Search across title, description, location, and category

### 📝 Booking System
- **Database Storage**: All bookings stored in Supabase
- **Attendee Validation**: Comprehensive form validation
- **Duplicate Prevention**: Email uniqueness validation
- **QR Code Support**: Infrastructure for QR code generation

### 👥 User Management
- **User Profiles**: Basic user management system
- **Role-based Access**: Support for attendees, organizers, and admins
- **Organizer KYC**: KYC verification system for event organizers

## API Functions

### Events Service (`src/lib/events-service.ts`)
- `getEvents()` - Fetch all published events
- `getEventById(id)` - Fetch single event with details
- `createBooking(bookingData)` - Create new booking with attendees
- `getUserBookings(userId)` - Fetch user's booking history

### Supabase Client (`src/lib/supabase.ts`)
- Pre-configured Supabase client
- TypeScript definitions for all database tables
- Type-safe database operations

## Next Steps

### 🔐 Authentication
- Implement user authentication with Supabase Auth
- Add protected routes for organizers
- User profile management

### 📊 Analytics
- Event view tracking
- Booking conversion metrics
- Revenue analytics

### 🎨 Enhanced Features
- QR code generation and scanning
- Email notifications
- Payment gateway integration
- Event reviews and ratings

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure Supabase credentials are correct
2. **Database Schema**: Verify all tables exist with proper constraints
3. **CORS Issues**: Check Supabase project settings for allowed origins

### Debugging
- Check browser console for API errors
- Verify Supabase logs in your project dashboard
- Use the Network tab to inspect API calls

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase connection in the Network tab
3. Ensure sample data was inserted successfully
4. Check Supabase project logs for backend errors

---

🎉 **Congratulations!** Your EventHive application is now powered by Supabase with dynamic data loading, real-time updates, and a robust booking system!

# 🎭 EventHive - Complete Event Management Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database-00C896?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Firebase-Auth-ffca28?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</div>
<div>
  ## Video Link
  [Video Link](https://drive.google.com/file/d/1GcldgN1KxsFYAL_CIS5TujT3pET7ti9g/view?usp=sharing)
</div>
<div align="center">
  <h3>🌟 Where Events Come Alive</h3>
  <p>A comprehensive event management platform featuring attendee booking, organizer management, QR-based check-ins, and real-time analytics.</p>
</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [📱 User Roles & Flow](#-user-roles--flow)
- [🗄️ Database Schema](#️-database-schema)
- [🔧 API Endpoints](#-api-endpoints)
- [🎨 UI Components](#-ui-components)
- [📊 Analytics & Reporting](#-analytics--reporting)
- [🔐 Authentication & Security](#-authentication--security)
- [🎫 QR Code System](#-qr-code-system)
- [📧 Email Automation](#-email-automation)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)

## 🌟 Overview

EventHive is a full-stack event management platform that enables users to discover, book, and organize events seamlessly. Built with **Next.js 15**, **Supabase**, and **Firebase Auth**, it features a modern UI with **Tailwind CSS**, comprehensive database integration, and real-time analytics.

### 🎯 Target Audience
- **Event Attendees**: Discover and book events with QR-based tickets
- **Event Organizers**: Create, manage, and analyze events with KYC verification
- **Administrators**: Oversee platform operations and user management

## ✨ Key Features

### 🎟️ For Attendees
- **Event Discovery**: Browse events by category, location, and status
- **Smart Booking System**: Multi-ticket booking with attendee management
- **QR Code Tickets**: Unique QR codes for each attendee with offline scanning
- **Booking Management**: View, download, and manage all bookings
- **Real-time Updates**: Live event status and availability updates

### 👨‍💼 For Organizers
- **KYC Verification**: Secure organizer onboarding with document verification
- **Event Creation Wizard**: 4-step guided event creation process
- **Comprehensive Analytics**: Revenue tracking, attendee insights, and sales data
- **Ticket Management**: Multiple ticket tiers with dynamic pricing
- **Check-in System**: QR code scanning for event entry
- **Email Automation**: Automated booking confirmations and updates

### 🔧 Technical Features
- **Offline Support**: QR code generation and basic functionality
- **Real-time Sync**: Live data synchronization across users
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Performance Optimized**: Turbopack compilation and code splitting
- **Type Safety**: Full TypeScript implementation with Zod validation

## 🏗️ Architecture

### 📁 Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── attendee/          # Attendee dashboard
│   ├── organizer/         # Organizer management
│   ├── events/            # Event pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── forms/            # Form components
│   └── charts/           # Analytics components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and services
│   ├── auth.ts           # Firebase authentication
│   ├── supabase.ts       # Supabase client & queries
│   ├── events-service.ts # Event management service
│   └── utils.ts          # Helper utilities
└── styles/               # Global styles
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn/pnpm
- **Firebase Project** with Google Auth enabled
- **Supabase Project** with PostgreSQL database

### 1. Clone & Install
```bash
git clone https://github.com/ayushmittal62/cgcXodoo_team_astrive.git
cd cgcXodoo_team_astrive
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the SQL schema:
```bash
# Run the schema in your Supabase SQL editor
# Use the provided supabase-setup.sql file
```

### 4. Start Development
```bash
npm run dev
```

Visit [http://localhost:3002](http://localhost:3002) to see the application.

## ⚙️ Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Authentication**
3. Add your domain to authorized domains
4. Copy configuration to `.env.local`

### Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema from `supabase-setup.sql`
3. Set up **Row Level Security** policies
4. Configure **Storage buckets** for file uploads
5. Copy URL and anon key to `.env.local`

## 📱 User Roles & Flow

### 🎭 Attendee Features
- Browse and discover events by categories
- Book multiple tickets with attendee details
- Receive QR codes for each attendee
- Manage bookings and download tickets
- Provide feedback and ratings

### 👨‍💼 Organizer Features
- Complete KYC verification process
- Create and manage events
- Track sales and analytics
- Scan QR codes for check-ins
- Manage attendee data

### 🔄 User Journey
1. **Discovery**: Landing page → Browse events → Event details
2. **Booking**: Select tickets → Add attendees → Payment → Confirmation
3. **Management**: Dashboard → View bookings → Download tickets → Check-in
4. **Organization**: KYC verification → Create events → Manage attendees → Analytics

## 🗄️ Database Schema

### Core Tables
```sql
-- Users (Firebase Auth + Profile)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'attendee',
  kyc_verified BOOLEAN DEFAULT FALSE
)

-- Organizers with KYC
organizers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  pan_number TEXT,
  aadhaar_number TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE
)

-- Events
events (
  id UUID PRIMARY KEY,
  organizer_id UUID REFERENCES organizers(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'draft'
)

-- Bookings with QR System
bookings (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL,
  booking_status TEXT DEFAULT 'confirmed',
  booking_reference TEXT UNIQUE
)

-- Individual Attendees with QR Codes
booking_attendees (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  name TEXT,
  email TEXT,
  qr_code TEXT UNIQUE,
  qr_image_url TEXT,
  checked_in BOOLEAN DEFAULT FALSE
)
```

## 🔧 API Endpoints

### Public APIs
```typescript
GET /api/events              // List all published events
GET /api/events/[id]         // Get specific event details
POST /api/bookings           // Create new booking
```

### Authenticated APIs
```typescript
// Attendee APIs
GET /api/attendee/bookings   // User's bookings
POST /api/attendee/feedback  // Submit event feedback

// Organizer APIs
GET /api/organizer/events    // Organizer's events
POST /api/organizer/events   // Create new event
GET /api/organizer/analytics // Event analytics
POST /api/organizer/kyc      // Submit KYC documents
```

## 🎨 UI Components

### Component Library (shadcn/ui)
- **Form Components**: Input, Select, Textarea, Checkbox
- **Layout**: Card, Dialog, Sheet, Tabs
- **Feedback**: Alert, Toast, Progress, Badge
- **Data Display**: Table, Avatar, Tooltip

### Custom Components
```typescript
// Event Components
<PublicEventCard />          // Event display for attendees
<OrganizerEventCard />       // Event management for organizers
<EventGrid />                // Event listing with filters

// Booking Components
<BookingForm />              // Multi-step booking process
<AttendeeForm />             // Individual attendee details
<QRCodeDisplay />            // QR code generation & display

// Analytics Components
<RevenueChart />             // Revenue analytics
<AttendeeInsights />         // Attendee demographics
<EventPerformance />         // Event metrics dashboard
```

## 📊 Analytics & Reporting

### Organizer Dashboard
- **Revenue Tracking**: Total revenue, daily trends
- **Attendee Insights**: Registration patterns, demographics
- **Event Performance**: Check-in rates, feedback analysis
- **Real-time Updates**: Live booking notifications

### Key Metrics
- Total Revenue across all events
- Active Events count
- Total Attendees registered
- Check-in Rate percentage

## 🔐 Authentication & Security

### Firebase Authentication
- **Google OAuth**: Primary sign-in method
- **Session Management**: Automatic token refresh
- **User Profiles**: Synced with Supabase database
- **Role-based Access**: Attendee/Organizer/Admin roles

### Security Features
- **Row Level Security**: Data access controls
- **Input Validation**: Zod schemas for all forms
- **File Upload Security**: Type and size restrictions
- **KYC Verification**: Document verification system

## 🎫 QR Code System

### QR Code Generation
- **Unique per Attendee**: Individual QR codes for each attendee
- **Offline Support**: Works without internet connection
- **Tamper Detection**: Secure data encoding
- **Bulk Generation**: Efficient processing for large events

### Check-in Process
1. **Scan QR Code**: Mobile or web-based scanning
2. **Verify Attendee**: Database lookup and validation
3. **Mark Check-in**: Update attendee status
4. **Confirmation**: Visual feedback for successful check-in

## 📧 Email Automation

### Automated Email System
- **Booking Confirmations**: Instant confirmation with QR codes
- **Event Updates**: Schedule changes and notifications
- **Check-in Reminders**: Pre-event attendee reminders
- **Organizer Alerts**: New booking and revenue notifications

### Backend Email Service
Located in `backend/email_automation.py`:
- Python-based email service
- Template-based email generation
- Queue system for bulk emails
- Integration with Supabase triggers

## 🧪 Testing

### Testing Stack
```bash
npm run dev               # Development server (port 3002)
npm run build             # Build for production
npm run lint              # ESLint checking
npm run type-check        # TypeScript validation
```

### Verification Scripts
- `check-db.js`: Database connection verification
- `verify-schema.js`: Schema validation
- `test-email-api.ps1`: Email service testing
- `qr-format-demo.js`: QR code format testing

## 🚀 Deployment

### Vercel Deployment (Recommended)
```bash
# Connect to Vercel
npx vercel

# Environment variables are configured in Vercel dashboard
# Automatic deployment on git push to main branch
```

### Environment Variables
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Performance Features
- **Turbopack**: Fast development builds
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Edge Functions**: Serverless API routes

## 📚 Additional Documentation

### Setup Guides
- `SUPABASE_INTEGRATION.md`: Database setup and configuration
- `GOOGLE_MAPS_SETUP.md`: Maps integration for event locations
- `ENHANCED_BOOKING_SUMMARY.md`: Booking system architecture
- `INTERACTIVE_CARDS_FEATURES.md`: UI component documentation

### Technical Specifications
- **Next.js 15.5.2**: Latest React framework with Turbopack
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript**: Full type safety implementation
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **TypeScript**: Full type safety required
- **ESLint**: Follow configured rules  
- **Prettier**: Automatic code formatting
- **Component Structure**: Modular, reusable components

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <p><strong>Built with ❤️ by the EventHive Team</strong></p>
  <p>🎭 <em>Where Events Come Alive</em> 🎭</p>
</div>

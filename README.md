# EventHive – Where Events Come Alive

EventHive is a robust, full-stack event management platform built with Next.js. It offers a unified login with dynamic role switching—serving both attendees and organizers in a single seamless system. Core features include event discovery, ticketing (with QR code), analytics, attendee feedback, secure payments, and organizer KYC, all with a modern, scalable TypeScript codebase.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Flows](#user-flows)
  - [Attendee Flow](#attendee-flow)
  - [Organizer Flow](#organizer-flow)
- [Backend Architecture](#backend-architecture)
- [Notifications & Analytics](#notifications--analytics)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Single Unified Login:** Google OAuth and Mobile OTP authentication. Email and mobile verification required.
- **Dual Role System:** Switch between 'Attendee' and 'Organizer' from the dashboard.
- **Event Listing:** Discover ongoing, upcoming, past events with detailed views.
- **Secure Ticket Booking:** Select ticket type/quantity, pay via Razorpay/Stripe/UPI/Cards, and receive QR tickets by email.
- **KYC for Organizers:** PAN verification (API), optional Aadhaar eKYC, and bank account validation.
- **Organizer Dashboard:** Manage events, sales analytics, guest list exports (CSV/Excel), and feedback.
- **Event Creation Flow:** Multi-step event setup (details, tickets, promotions, preview/publish/cancel).
- **QR Scan Access Control:** On-site ticket check-in and duplicate prevention.
- **Feedback & Ratings:** Attendees can rate and review events and organizers.
- **Automated Notifications:** Confirmations, reminders, cancellations with automatic refunds.

---

## Project Structure

This project uses a modular Next.js app directory layout with TypeScript for all logic:

```
/app         # Main Next.js app pages, including dashboard and event pages
/components  # React components for UI, event cards, ticket forms, navigation, etc.
/lib         # API utilities, authentication, payment and QR generation logic
/hooks       # Custom React hooks for feature logic
/styles      # CSS and theme management
/types       # TypeScript types and interfaces
/public      # Static assets (images, logos, event posters)
/README.md   # Project documentation
```

---

## Getting Started

1. **Clone and Install Dependencies**
   ```
   git clone https://github.com/dexxeth/cgcXodoo_team_astrive.git
   cd cgcXodoo_team_astrive
   npm install          # or yarn install
   ```

2. **Run the Development Server**
   ```
   npm run dev          # or yarn dev
   ```
   The app starts at [http://localhost:3000](http://localhost:3000).

3. **Configure Environment Variables**
   - Rename `.env.example` to `.env.local` and add credentials for:
     - Google OAuth
     - Payment gateways (Razorpay/Stripe)
     - Email/WhatsApp services (for notifications)

4. **Edit Pages**
   - Main code is in `app/page.tsx`. Changes here instantly update the UI.

---

## User Flows

### Attendee Flow

- **Dashboard:** View My Bookings, discover events (ongoing/upcoming/past).
- **Event Card:** See event details, select tickets, and book.
- **Booking:** Fill attendee info, proceed to payment, receive QR ticket via email.
- **My Bookings:** Access tickets, track upcoming/past events.
- **Past Events:** Rate and provide feedback for attended events.

### Organizer Flow

- **Switch Role:** Initiate KYC (PAN/API, Aadhaar/DigiLocker, bank verification) for first-time organizers.
- **Dashboard:** Manage events (create, modify, publish/unpublish, cancel).
- **Analytics:** See sales, revenue, check-ins, and feedback per event.
- **Event Creation (multi-step):**
    1. Event details (logo, title, desc, date, etc.)
    2. Ticketing (type, price, limits)
    3. Promotions/coupons
    4. Publish and preview
- **Guest List:** Export bookings as CSV/Excel.
- **QR Code Scanner:** Validate entry at the venue to prevent duplicates.
- **Feedback:** View attendee ratings and reviews.

---

## Backend Architecture

- Unified users table tracks email, mobile, and dual roles.
- Organizer features require verified KYC.
- Bookings map user <-> ticket <-> event <-> payment.
- Each ticket generates a single-use QR code for entry validation.
- Payments integrated via Razorpay/Stripe; refunds processed automatically for cancellations.
- Events marked public (open to all) or private (invite/RSVP with guest list).

---

## Notifications & Analytics

- Email/WhatsApp: instant bookings, event reminders (24h & 1h), cancellations, and auto-refunds.
- Admin/organizer analytics: ticket sales, revenue, check-in stats, feedback insights.
- Event analytics table: views, bookings, revenue summary.

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, modern CSS
- **Authentication:** Google OAuth, mobile OTP
- **Payments:** Razorpay, Stripe, UPI, cards, wallets
- **KYC & Verification:** PAN API, DigiLocker Aadhaar, microdeposit bank verification
- **Other:** Email/WhatsApp APIs, QR code libraries, CSV/Excel export tools

---

## Contributing

1. Fork this repository.
2. Create a new branch for your feature/fix.
3. Submit a pull request with detailed description.
4. Contributions and feedback are welcome!

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

For any issues or feature requests, please open an issue on the [GitHub repository](https://github.com/ayushmittal62/cgcXodoo_team_astrive).

---
```

To download:

1. Copy all of the above text.
2. Open a text editor (VS Code, Notepad, Sublime Text, etc.).
3. Paste the content.
4. Save as `README.md` (set encoding to UTF-8 if asked).

This will provide a professional, detailed Markdown file for your repository, ready to use or further customize as needed.[10]

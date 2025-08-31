# EventHive Email Automation - Brevo Setup Guide

## Overview
This email automation service now uses Brevo (formerly Sendinblue) SMTP for sending booking confirmation emails. Brevo provides reliable email delivery with better deliverability rates compared to Gmail SMTP.

## Brevo Setup Instructions

### 1. Create a Brevo Account
1. Go to [https://app.brevo.com/](https://app.brevo.com/)
2. Sign up for a free account or log in to your existing account

### 2. Verify Your Sender Email
1. In your Brevo dashboard, go to **Senders & IP** > **Senders**
2. Add and verify your sender email address
3. Follow the verification process (email verification + SPF/DKIM setup)

### 3. Get Your API Key
1. Go to **SMTP & API** > **SMTP**
2. Click on "Generate a new SMTP key" or use an existing one
3. Copy the API key - this will be used as your SMTP password

### 4. Update Environment Configuration
Update your `.env` file with the following Brevo settings:

```env
# Brevo SMTP Configuration
BREVO_SMTP_SERVER=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender_email@yourdomain.com
BREVO_SENDER_NAME=EventHive
```

### 5. Test Configuration
Run the test command to verify your Brevo setup:

```bash
python email_automation.py test
```

## Benefits of Using Brevo

1. **Better Deliverability**: Higher inbox delivery rates compared to Gmail SMTP
2. **No Daily Limits**: More generous sending limits compared to Gmail
3. **Professional Appearance**: Emails sent from your domain instead of Gmail
4. **Analytics**: Built-in email tracking and analytics
5. **Scalability**: Designed for transactional emails and marketing campaigns

## Troubleshooting

### Common Issues:

1. **535 Authentication Error**: 
   - Verify your API key is correct
   - Ensure your sender email is verified in Brevo

2. **Sender Not Verified**:
   - Go to Brevo dashboard and verify your sender email
   - Set up SPF and DKIM records for better deliverability

3. **Rate Limiting**:
   - Check your Brevo account limits
   - Upgrade your plan if needed for higher sending volumes

## Migration from Gmail

All Gmail SMTP references have been removed from the codebase:
- ✅ Updated SMTP server configuration
- ✅ Replaced Gmail credentials with Brevo API key
- ✅ Updated error messages and logging
- ✅ Modified email headers and sender information
- ✅ Updated test functions

The automation service is now fully integrated with Brevo SMTP for reliable email delivery.

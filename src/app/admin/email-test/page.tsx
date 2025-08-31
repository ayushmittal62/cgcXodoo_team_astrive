'use client'

import { useState } from 'react'

export default function EmailTestingPage() {
  const [bookingId, setBookingId] = useState('')
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testEmailConfig = async () => {
    setLoading(true)
    setTestResult('Testing email configuration...')
    
    try {
      const response = await fetch('/api/test-email-config')
      const result = await response.json()
      
      if (result.success) {
        setTestResult(`✅ Email configuration is working!\n\n${result.output}`)
      } else {
        setTestResult(`❌ Email configuration failed:\n\n${result.details || result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Error testing email: ${error}`)
    }
    
    setLoading(false)
  }

  const sendSpecificEmail = async () => {
    if (!bookingId.trim()) {
      alert('Please enter a booking ID')
      return
    }
    
    setLoading(true)
    setTestResult(`Sending email for booking ${bookingId}...`)
    
    try {
      const response = await fetch('/api/send-ticket-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestResult(`✅ Email sent successfully!\n\n${result.output}`)
      } else {
        setTestResult(`❌ Email sending failed:\n\n${result.details || result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Error sending email: ${error}`)
    }
    
    setLoading(false)
  }

  const processPendingEmails = async () => {
    setLoading(true)
    setTestResult('Processing all pending emails...')
    
    try {
      const response = await fetch('/api/process-pending-emails', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestResult(`✅ Batch email processing completed!\n\n${result.output}`)
      } else {
        setTestResult(`❌ Batch processing failed:\n\n${result.details || result.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Error processing emails: ${error}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📧 Email Automation Testing
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Test Email Configuration */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              🧪 Test Email Configuration
            </h2>
            <p className="text-gray-600 mb-4">
              Test if Supabase and Brevo SMTP are properly configured
            </p>
            <button
              onClick={testEmailConfig}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Configuration'}
            </button>
          </div>

          {/* Send Specific Email */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              📧 Send Specific Email
            </h2>
            <input
              type="text"
              placeholder="Enter Booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
            />
            <button
              onClick={sendSpecificEmail}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>

          {/* Process All Pending */}
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">
              📨 Process All Pending Emails
            </h2>
            <p className="text-gray-600 mb-4">
              Send emails to all users with email_status = 'pending'
            </p>
            <button
              onClick={processPendingEmails}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Process All Pending'}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {testResult && (
          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {testResult}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 How Email Automation Works
          </h3>
          <ul className="list-disc list-inside text-blue-800 space-y-2">
            <li>
              <strong>Automatic Trigger:</strong> When users book tickets, emails are automatically sent
            </li>
            <li>
              <strong>QR Code Included:</strong> Each email contains the event QR code for entry
            </li>
            <li>
              <strong>Supabase Integration:</strong> Fetches real booking data from your database
            </li>
            <li>
              <strong>Status Tracking:</strong> Updates email_status to 'sent' after successful delivery
            </li>
            <li>
              <strong>Error Handling:</strong> Booking still succeeds even if email fails
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

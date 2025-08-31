import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    console.log(`📧 Triggering email automation for booking: ${bookingId}`)

    // Get the project root directory
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'backend', 'email_automation.py')
    
    // Execute the Python email automation script
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" ${bookingId}`,
      { cwd: projectRoot, timeout: 60000 } // 60 second timeout
    )
    
    if (stderr && !stderr.includes('FutureWarning')) {
      console.error('❌ Email automation stderr:', stderr)
      return NextResponse.json(
        { error: 'Email automation failed', details: stderr },
        { status: 500 }
      )
    }

    console.log('✅ Email automation completed:', stdout)
    
    // Parse the output to extract result info
    const lines = stdout.split('\n').filter(line => line.trim())
    const lastLine = lines[lines.length - 1] || ''
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      bookingId,
      output: stdout,
      details: lastLine
    })

  } catch (error: any) {
    console.error('❌ Email API error:', error)
    
    // More detailed error logging
    if (error.code) {
      console.error(`Error code: ${error.code}`)
    }
    if (error.signal) {
      console.error(`Process killed with signal: ${error.signal}`)
    }
    
    let errorMessage = error.message
    
    // Check if Python is available
    if (error.message.includes("'python' is not recognized")) {
      errorMessage = "Python is not available. Please ensure Python is installed and in PATH."
    }
    // Check for common Python issues
    else if (error.message.includes("No module named")) {
      errorMessage = "Required Python packages not installed. Run: pip install -r backend/email_requirements.txt"
    }
    // Check for environment variable issues
    else if (error.message.includes("None")) {
      errorMessage = "Environment variables not configured. Check .env.local file."
    }
    
    return NextResponse.json({
      error: 'Failed to send email',
      details: errorMessage,
      bookingId: request.body ? (await request.json()).bookingId : 'unknown'
    }, { status: 500 })
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const bookingId = searchParams.get('bookingId')
  
  if (!bookingId) {
    return NextResponse.json(
      { error: 'Booking ID is required as query parameter' },
      { status: 400 }
    )
  }

  // Create a mock POST request body and call POST handler
  const mockRequest = {
    json: async () => ({ bookingId })
  } as NextRequest

  return POST(mockRequest)
}

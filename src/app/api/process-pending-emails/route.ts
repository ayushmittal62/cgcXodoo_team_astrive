import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log(`📧 Processing all pending ticket emails...`)

    // Get the project root directory
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'backend', 'email_automation.py')
    
    // Execute the Python email automation script for all pending emails
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" all`,
      { cwd: projectRoot, timeout: 180000 } // 3 minute timeout for batch processing
    )
    
    if (stderr && !stderr.includes('FutureWarning')) {
      console.error('❌ Batch email automation stderr:', stderr)
      return NextResponse.json(
        { error: 'Batch email automation failed', details: stderr },
        { status: 500 }
      )
    }

    console.log('✅ Batch email automation completed:', stdout)
    
    // Parse the output to extract result info
    const lines = stdout.split('\n').filter(line => line.trim())
    const resultLines = lines.filter(line => 
      line.includes('Successfully sent:') || 
      line.includes('Failed:') || 
      line.includes('Processed')
    )
    
    return NextResponse.json({
      success: true,
      message: 'Batch email processing completed',
      output: stdout,
      summary: resultLines
    })

  } catch (error: any) {
    console.error('❌ Batch email API error:', error)
    
    return NextResponse.json({
      error: 'Failed to process batch emails',
      details: error.message
    }, { status: 500 })
  }
}

// Support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request)
}

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    console.log(`🧪 Testing email automation configuration...`)

    // Get the project root directory
    const projectRoot = process.cwd()
    const scriptPath = path.join(projectRoot, 'backend', 'email_automation.py')
    
    // Execute the Python email automation test
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" test`,
      { cwd: projectRoot, timeout: 30000 } // 30 second timeout
    )
    
    if (stderr && !stderr.includes('FutureWarning')) {
      console.error('❌ Email test stderr:', stderr)
      return NextResponse.json(
        { 
          success: false,
          error: 'Email configuration test failed', 
          details: stderr,
          stdout 
        },
        { status: 500 }
      )
    }

    console.log('✅ Email test completed:', stdout)
    
    // Check if test passed
    const testPassed = stdout.includes('All configurations are working correctly') || 
                       stdout.includes('✅')
    
    return NextResponse.json({
      success: testPassed,
      message: testPassed ? 'Email configuration is working!' : 'Email configuration needs attention',
      output: stdout,
      details: stdout.split('\n').filter(line => line.trim())
    })

  } catch (error: any) {
    console.error('❌ Email test API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test email configuration',
      details: error.message
    }, { status: 500 })
  }
}

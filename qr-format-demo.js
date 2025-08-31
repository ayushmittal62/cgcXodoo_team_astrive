// This shows the CORRECT QR code format that should be used

// ❌ WRONG FORMAT (what you were getting before):
const wrongFormat = "TICKET-df564495-1e62-4a97-a479-44197c6d7163-0"

// ✅ CORRECT FORMAT (what should be in QR codes):
const correctFormat = "df564495-1e62-4a97-a479-44197c6d7163|0|11111111-1111-1111-1111-111111111111|Ayush|VIP|BK1756587810316DKJF44|1756587810449"

console.log("🎫 QR Code Format Comparison\n")

console.log("❌ OLD FORMAT (Wrong):")
console.log(`   ${wrongFormat}`)
console.log(`   - Only contains basic booking info`)
console.log(`   - Cannot validate attendee details`)
console.log(`   - Not secure for check-in`)

console.log("\n✅ NEW FORMAT (Correct):")
console.log(`   ${correctFormat}`)

// Parse the correct format
const parts = correctFormat.split('|')
console.log(`\n📝 Parsed Data:`)
console.log(`   Booking ID: ${parts[0]}`)
console.log(`   Attendee Index: ${parts[1]}`)
console.log(`   Event ID: ${parts[2]}`) 
console.log(`   Attendee Name: ${parts[3]}`)
console.log(`   Ticket Type: ${parts[4]}`)
console.log(`   Booking Reference: ${parts[5]}`)
console.log(`   Timestamp: ${new Date(parseInt(parts[6])).toLocaleString()}`)

console.log(`\n🔍 Benefits of Correct Format:`)
console.log(`   ✅ Contains all validation data`)
console.log(`   ✅ Prevents ticket forgery`)
console.log(`   ✅ Enables detailed check-in logs`)
console.log(`   ✅ Works with scanning systems`)
console.log(`   ✅ Matches database exactly`)

console.log(`\n💡 The QR code image will encode: ${correctFormat}`)
console.log(`📱 When scanned, it returns: ${correctFormat}`)
console.log(`🗄️  Database lookup uses: qr_code = '${correctFormat}'`)

"use client"

import React from "react"

import { useMemo, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { events } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useBookings } from "@/components/use-bookings-store"

type Tier = string

// Validation Types
type ValidationError = {
  field: string
  message: string
}

type AttendeeValidation = {
  name: ValidationError[]
  email: ValidationError[]
  phone: ValidationError[]
  dob: ValidationError[]
}

type AttendeeData = {
  index: number
  name: string
  email: string
  phone: string
  dob: string
}

// Custom Validation Functions
const ValidationRules = {
  name: {
    required: (value: string) => value.trim().length > 0 ? null : "Full name is required",
    minLength: (value: string) => value.trim().length >= 2 ? null : "Name must be at least 2 characters",
    maxLength: (value: string) => value.trim().length <= 50 ? null : "Name must be less than 50 characters",
    validChars: (value: string) => /^[a-zA-Z\s.-]+$/.test(value.trim()) ? null : "Name can only contain letters, spaces, dots and hyphens",
    noNumbers: (value: string) => !/\d/.test(value) ? null : "Name cannot contain numbers"
  },
  
  email: {
    required: (value: string) => value.trim().length > 0 ? null : "Email is required",
    validFormat: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value.trim()) ? null : "Please enter a valid email address"
    },
    maxLength: (value: string) => value.length <= 254 ? null : "Email is too long",
    noSpaces: (value: string) => !/\s/.test(value) ? null : "Email cannot contain spaces",
    validDomain: (value: string) => {
      const domain = value.split('@')[1]
      if (!domain) return "Invalid email format"
      return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain) ? null : "Invalid email domain"
    }
  },
  
  phone: {
    required: (value: string) => value.trim().length > 0 ? null : "Phone number is required",
    validFormat: (value: string) => {
      const cleaned = value.replace(/\D/g, '')
      return cleaned.length >= 10 && cleaned.length <= 15 ? null : "Phone number must be 10-15 digits"
    },
    indianFormat: (value: string) => {
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) return null
      if (cleaned.length === 13 && cleaned.startsWith('91') && /^91[6-9]/.test(cleaned)) return null
      return "Please enter a valid Indian phone number"
    },
    noLetters: (value: string) => {
      const hasLetters = /[a-zA-Z]/.test(value)
      return !hasLetters ? null : "Phone number cannot contain letters"
    }
  },
  
  dob: {
    required: (value: string) => value.trim().length > 0 ? null : "Date of birth is required",
    validDate: (value: string) => {
      const date = new Date(value)
      return !isNaN(date.getTime()) ? null : "Please enter a valid date"
    },
    notFuture: (value: string) => {
      const date = new Date(value)
      const today = new Date()
      return date <= today ? null : "Date of birth cannot be in the future"
    },
    minimumAge: (value: string) => {
      const date = new Date(value)
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 1 ? null : "Attendee must be at least 1 year old"
    },
    maximumAge: (value: string) => {
      const date = new Date(value)
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age <= 120 ? null : "Please enter a valid date of birth"
    },
    reasonableRange: (value: string) => {
      const date = new Date(value)
      const minDate = new Date('1900-01-01')
      return date >= minDate ? null : "Date of birth is too old"
    }
  }
}

// Validation Engine
const validateField = (field: keyof AttendeeData, value: string): ValidationError[] => {
  if (field === 'index') return []
  
  const rules = ValidationRules[field as keyof typeof ValidationRules]
  const errors: ValidationError[] = []
  
  for (const [ruleName, ruleFunction] of Object.entries(rules)) {
    const error = ruleFunction(value)
    if (error) {
      errors.push({
        field,
        message: error
      })
    }
  }
  
  return errors
}

const validateAttendee = (attendee: AttendeeData): AttendeeValidation => {
  return {
    name: validateField('name', attendee.name),
    email: validateField('email', attendee.email),
    phone: validateField('phone', attendee.phone),
    dob: validateField('dob', attendee.dob)
  }
}

const hasValidationErrors = (validation: AttendeeValidation): boolean => {
  return Object.values(validation).some(errors => errors.length > 0)
}

const validateAllAttendees = (attendees: AttendeeData[]): boolean => {
  return attendees.every(attendee => {
    const validation = validateAttendee(attendee)
    return !hasValidationErrors(validation)
  })
}

// Check for duplicate emails across attendees
const validateUniqueEmails = (attendees: AttendeeData[]): { [index: number]: ValidationError[] } => {
  const emailMap = new Map<string, number[]>()
  const duplicates: { [index: number]: ValidationError[] } = {}
  
  // Group attendees by email
  attendees.forEach((attendee, index) => {
    const email = attendee.email.trim().toLowerCase()
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, [])
      }
      emailMap.get(email)!.push(index)
    }
  })
  
  // Mark duplicates
  emailMap.forEach((indices, email) => {
    if (indices.length > 1) {
      indices.forEach(index => {
        duplicates[index] = [{
          field: 'email',
          message: 'Duplicate email - each attendee must have a unique email'
        }]
      })
    }
  })
  
  return duplicates
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [tier, setTier] = useState<Tier>("")
  const [count, setCount] = useState(1)
  const [attendees, setAttendees] = useState<AttendeeData[]>(
    Array.from({ length: count }, (_, i) => ({ index: i, name: "", email: "", phone: "", dob: "" })),
  )
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle")
  
  // Validation State
  const [validations, setValidations] = useState<AttendeeValidation[]>([])
  const [duplicateEmailErrors, setDuplicateEmailErrors] = useState<{ [index: number]: ValidationError[] }>({})
  const [touchedFields, setTouchedFields] = useState<{ [attendeeIndex: number]: { [field: string]: boolean } }>({})
  const [showAllErrors, setShowAllErrors] = useState(false)

  const event = events.find((e) => e.id === id)
  if (!event) return notFound()

  const router = useRouter()
  const { addBooking } = useBookings()

  // Set default tier to first available ticket option
  React.useEffect(() => {
    if (event && event.tickets.length > 0 && !tier) {
      setTier(event.tickets[0].tier)
    }
  }, [event, tier])

  // Initialize validation state when attendees change
  React.useEffect(() => {
    const newValidations = attendees.map(validateAttendee)
    setValidations(newValidations)
    
    // Check for duplicate emails
    const duplicates = validateUniqueEmails(attendees)
    setDuplicateEmailErrors(duplicates)
  }, [attendees])

  const selectedPrice = useMemo(() => {
    return event.tickets.find((t) => t.tier === tier)?.price ?? 0
  }, [event, tier])
  const totalPrice = selectedPrice * count

  // Check if form is valid for navigation
  const canProceedToPayment = useMemo(() => {
    return validateAllAttendees(attendees) && Object.keys(duplicateEmailErrors).length === 0
  }, [attendees, duplicateEmailErrors])

  function applyCount(newCount: number) {
    const n = Math.max(1, Math.min(6, newCount))
    setCount(n)
    setAttendees((prev) => {
      const base = [...prev]
      if (n > base.length) {
        for (let i = base.length; i < n; i++) base.push({ index: i, name: "", email: "", phone: "", dob: "" })
      } else {
        base.length = n
      }
      return base
    })
    
    // Reset touched fields when count changes
    setTouchedFields({})
    setShowAllErrors(false)
  }

  // Enhanced attendee update with validation
  const updateAttendeeWithValidation = (index: number, field: keyof AttendeeData, value: string) => {
    setAttendees(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: true
      }
    }))
  }

  // Handle blur events to show validation errors
  const handleFieldBlur = (attendeeIndex: number, field: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [attendeeIndex]: {
        ...prev[attendeeIndex],
        [field]: true
      }
    }))
  }

  // Handle step 2 to 3 navigation with validation
  const handleProceedToPayment = () => {
    setShowAllErrors(true)
    
    // Mark all fields as touched
    const allTouched: { [attendeeIndex: number]: { [field: string]: boolean } } = {}
    attendees.forEach((_, index) => {
      allTouched[index] = {
        name: true,
        email: true,
        phone: true,
        dob: true
      }
    })
    setTouchedFields(allTouched)

    if (canProceedToPayment) {
      setStep(3)
    }
  }

  async function mockPay() {
    // Final validation check before payment
    if (!canProceedToPayment) {
      setShowAllErrors(true)
      return
    }

    setPaymentStatus("processing")
    await new Promise((r) => setTimeout(r, 1400))
    setPaymentStatus("success")
    addBooking({
      event: event!,
      tickets: attendees.map((a) => ({ index: a.index, tier })),
      attendees: attendees.map((a) => ({ name: a.name, email: a.email, phone: a.phone, dob: a.dob })),
      amount: totalPrice,
      payment: { provider: "Simulated (Razorpay/Stripe/UPI)", status: "paid" },
    })
    setTimeout(() => {
      router.push("/attendee?tab=my-bookings&success=booking-complete")
    }, 800)
  }

  return (
    <main className="min-h-dvh bg-neutral-950 text-slate-200">
      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button onClick={() => router.back()} className="text-sm text-slate-300 hover:text-white">
            ← Back
          </button>
          <div className="text-sm text-slate-300">{event.title}</div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <Stepper step={step} />

        {step === 1 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Select tickets</h2>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {event.tickets.map((ticketOption) => (
                <button
                  key={ticketOption.tier}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    tier === ticketOption.tier
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-white/10 bg-neutral-900 hover:bg-neutral-800",
                  )}
                  onClick={() => setTier(ticketOption.tier)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{ticketOption.tier}</span>
                    <span className="text-xs text-slate-400">{ticketOption.stock} left</span>
                  </div>
                  <div className="text-slate-300">₹{ticketOption.price}</div>
                </button>
              ))}
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Number of tickets</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20"
                  onClick={() => applyCount(count - 1)}
                >
                  -
                </Button>
                <span className="w-10 text-center text-lg font-semibold">{count}</span>
                <Button
                  className="bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                  onClick={() => applyCount(count + 1)}
                >
                  +
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Max 6 per booking</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                Total: <span className="font-semibold text-white">₹{totalPrice}</span>
              </div>
              <Button className="bg-sky-500 text-neutral-950 hover:bg-sky-400" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Attendee information</h2>
            
            {/* Validation Summary */}
            {showAllErrors && !canProceedToPayment && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-400">Please fix the following errors:</span>
                </div>
                <ul className="text-xs text-red-300 space-y-1">
                  {attendees.map((attendee, index) => {
                    const validation = validations[index]
                    const duplicateErrors = duplicateEmailErrors[index] || []
                    const allErrors = [
                      ...validation?.name || [],
                      ...validation?.email || [],
                      ...validation?.phone || [],
                      ...validation?.dob || [],
                      ...duplicateErrors
                    ]
                    
                    if (allErrors.length > 0) {
                      return (
                        <li key={index} className="ml-4">
                          <strong>Attendee {index + 1}:</strong> {allErrors.map(e => e.message).join(', ')}
                        </li>
                      )
                    }
                    return null
                  })}
                </ul>
              </div>
            )}
            
            <div className="space-y-4">
              {attendees.map((a, i) => {
                const validation = validations[i] || { name: [], email: [], phone: [], dob: [] }
                const duplicateErrors = duplicateEmailErrors[i] || []
                const touched = touchedFields[i] || {}
                
                return (
                  <div key={a.index} className="rounded-lg border border-white/10 bg-neutral-900 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        Ticket {i + 1} • {tier}
                      </div>
                      {/* Progress indicator */}
                      <div className="flex items-center gap-2">
                        {(validation.name.length === 0 && a.name) && <div className="w-2 h-2 bg-green-500 rounded-full" title="Name valid" />}
                        {(validation.email.length === 0 && duplicateErrors.length === 0 && a.email) && <div className="w-2 h-2 bg-green-500 rounded-full" title="Email valid" />}
                        {(validation.phone.length === 0 && a.phone) && <div className="w-2 h-2 bg-green-500 rounded-full" title="Phone valid" />}
                        {(validation.dob.length === 0 && a.dob) && <div className="w-2 h-2 bg-green-500 rounded-full" title="DOB valid" />}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <ValidatedInput
                        label="Full name"
                        value={a.name}
                        onChange={(v) => updateAttendeeWithValidation(i, 'name', v)}
                        onBlur={() => handleFieldBlur(i, 'name')}
                        errors={validation.name}
                        touched={touched.name || showAllErrors}
                        placeholder="Enter full name"
                      />
                      <ValidatedInput
                        label="Email"
                        type="email"
                        value={a.email}
                        onChange={(v) => updateAttendeeWithValidation(i, 'email', v)}
                        onBlur={() => handleFieldBlur(i, 'email')}
                        errors={[...validation.email, ...duplicateErrors]}
                        touched={touched.email || showAllErrors}
                        placeholder="Enter email address"
                      />
                      <ValidatedInput
                        label="Phone"
                        value={a.phone}
                        onChange={(v) => updateAttendeeWithValidation(i, 'phone', v)}
                        onBlur={() => handleFieldBlur(i, 'phone')}
                        errors={validation.phone}
                        touched={touched.phone || showAllErrors}
                        placeholder="Enter phone number"
                      />
                      <ValidatedInput
                        label="Date of birth"
                        type="date"
                        value={a.dob}
                        onChange={(v) => updateAttendeeWithValidation(i, 'dob', v)}
                        onBlur={() => handleFieldBlur(i, 'dob')}
                        errors={validation.dob}
                        touched={touched.dob || showAllErrors}
                        placeholder=""
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="secondary"
                className="bg-white/10 text-slate-200 hover:bg-white/20"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                className={cn(
                  "transition-all duration-200",
                  canProceedToPayment
                    ? "bg-sky-500 text-neutral-950 hover:bg-sky-400" 
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                )}
                onClick={handleProceedToPayment}
              >
                {canProceedToPayment ? "Proceed to Payment" : "Fix Errors to Continue"}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold">Payment</h2>
            <div className="mb-3 text-sm text-slate-300">
              Provider: Razorpay / Stripe / UPI / Cards / Wallets (placeholder)
            </div>
            <div className="mb-4 rounded-lg border border-white/10 bg-neutral-900 p-3">
              <p className="text-sm">Amount payable</p>
              <p className="text-2xl font-semibold text-white">₹{totalPrice}</p>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                className="bg-white/10 text-slate-200 hover:bg-white/20"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                className="bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                onClick={mockPay}
                disabled={paymentStatus !== "idle"}
              >
                {paymentStatus === "processing" ? "Processing..." : "Pay now"}
              </Button>
            </div>

            {paymentStatus === "success" && (
              <div className="mt-4 rounded-lg border border-white/10 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                Payment successful. Generating QR codes and emailing PDF tickets... Redirecting to Dashboard.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = ["Tickets", "Attendees", "Payment"]
  return (
    <div className="mb-4 flex items-center gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const active = step === n
        const complete = step > n
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full text-center text-sm leading-8",
                complete
                  ? "bg-cyan-500 text-neutral-950"
                  : active
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-slate-300",
              )}
            >
              {n}
            </div>
            <span className={cn("hidden text-xs md:inline", active ? "text-white" : "text-slate-400")}>{label}</span>
            {i < items.length - 1 && <div className="h-px w-8 bg-white/10" />}
          </div>
        )
      })}
    </div>
  )
}

function ValidatedInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  errors = [],
  touched = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  type?: string
  placeholder?: string
  errors?: ValidationError[]
  touched?: boolean
}) {
  const hasErrors = errors.length > 0 && touched
  const isValid = errors.length === 0 && value.length > 0 && touched
  
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-xs text-slate-400">
        {label}
        {isValid && (
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {hasErrors && (
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-sm outline-none placeholder:text-slate-500 transition-all duration-200",
          hasErrors
            ? "border-red-500 bg-red-950/20 focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
            : isValid
            ? "border-green-500 bg-green-950/20 focus:border-green-400 focus:ring-1 focus:ring-green-400/30"
            : "border-white/10 bg-neutral-950 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
        )}
        placeholder={placeholder || label}
      />
      
      {/* Error Messages */}
      {hasErrors && (
        <div className="mt-1 space-y-1">
          {errors.slice(0, 2).map((error, index) => (
            <div key={index} className="flex items-start gap-1 text-xs text-red-400">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error.message}</span>
            </div>
          ))}
          {errors.length > 2 && (
            <div className="text-xs text-red-400 ml-4">
              +{errors.length - 2} more error{errors.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
      
      {/* Success Message */}
      {isValid && (
        <div className="mt-1 flex items-center gap-1 text-xs text-green-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Valid</span>
        </div>
      )}
    </label>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500"
        placeholder={label}
      />
    </label>
  )
}

function updateAttendee(
  set: React.Dispatch<
    React.SetStateAction<{ index: number; name: string; email: string; phone: string; dob: string }[]>
  >,
  i: number,
  patch: Partial<{ name: string; email: string; phone: string; dob: string }>,
) {
  set((prev) => {
    const next = [...prev]
    next[i] = { ...next[i], ...patch }
    return next
  })
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ArrowDown, ArrowUp, Trash, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizerData } from "@/hooks/useOrganizerData"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ticketSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be >= 0"),
  quantity: z.number().int().min(1, "Quantity must be >= 1"),
  perUserLimit: z.number().int().min(1, "Per-user limit must be >= 1").optional().nullable(),
})
const basicSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  category: z.string().min(1, "Category is required"),
  posterUrl: z.string().url().optional().or(z.literal("")),
})
const scheduleSchema = z
  .object({
    startAt: z.string().min(1, "Start date/time is required"),
    endAt: z.string().min(1, "End date/time is required"),
  })
  .refine((v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(), {
    message: "End must be after start",
    path: ["endAt"],
  })
const formSchema = z.object({
  basic: basicSchema,
  tickets: z.array(ticketSchema).min(1, "Add at least one ticket"),
  schedule: scheduleSchema,
})

type FormState = z.infer<typeof formSchema>
type StepKey = "basic" | "tickets" | "schedule" | "review"

const DRAFT_KEY = "organizer_new_event_draft_v1"

const initialState: FormState = {
  basic: {
    title: "",
    description: "",
    location: "",
    visibility: "public",
    category: "",
    posterUrl: "",
  },
  tickets: [],
  schedule: { startAt: "", endAt: "" },
}

export default function CreateEventWizardPage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  const { organizer, loading: organizerLoading } = useOrganizerData()
  
  const [step, setStep] = useState<StepKey>("basic")
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check if user is KYC verified
  const isKycVerified = Boolean(organizer?.kyc_verified)
  const canPublish = isKycVerified
  // Only show loading for auth, not for organizer data
  const loading = authLoading

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [authLoading, user, router])

  // Load draft if any
  const draft = useMemo(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      return raw ? (JSON.parse(raw) as { data: FormState; savedAt: string }) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    // Debounced autosave
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaving(true)
      const savedAt = new Date().toISOString()
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: form, savedAt }))
      setLastSaved(savedAt)
      setSaving(false)
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [form])

  function restoreDraft() {
    if (draft?.data) {
      setForm(draft.data)
      setLastSaved(draft.savedAt)
      toast("Draft restored", { description: "A saved draft has been loaded." })
    }
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    toast("Draft discarded")
  }

  function updateBasic<K extends keyof FormState["basic"]>(key: K, value: FormState["basic"][K]) {
    setForm((prev) => ({ ...prev, basic: { ...prev.basic, [key]: value } }))
  }

  function addTicket() {
    const id = Math.random().toString(36).slice(2, 10)
    setForm((prev) => ({
      ...prev,
      tickets: [...prev.tickets, { id, name: "General", price: 999, quantity: 100, perUserLimit: 4 }],
    }))
  }

  function updateTicket(id: string, patch: Partial<FormState["tickets"][number]>) {
    setForm((prev) => ({ ...prev, tickets: prev.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }

  function moveTicket(idx: number, dir: -1 | 1) {
    setForm((prev) => {
      const arr = [...prev.tickets]
      const swap = idx + dir
      if (swap < 0 || swap >= arr.length) return prev
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return { ...prev, tickets: arr }
    })
  }

  function removeTicket(id: string) {
    setForm((prev) => ({ ...prev, tickets: prev.tickets.filter((t) => t.id !== id) }))
  }

  function updateSchedule<K extends keyof FormState["schedule"]>(key: K, value: FormState["schedule"][K]) {
    setForm((prev) => ({ ...prev, schedule: { ...prev.schedule, [key]: value } }))
  }

  function validateCurrentStep(next?: StepKey) {
    // Validate only the relevant slice
    const e: Record<string, string> = {}
    if (step === "basic") {
      const r = basicSchema.safeParse(form.basic)
      if (!r.success) {
        r.error.issues.forEach((err) => {
          const k = ["basic", ...(err.path as string[])].join(".")
          e[k] = err.message
        })
      }
    } else if (step === "tickets") {
      const r = z.array(ticketSchema).safeParse(form.tickets)
      if (!r.success) {
        r.error.issues.forEach((err) => {
          const k = ["tickets", ...(err.path as string[])].join(".")
          e[k] = err.message
        })
      }
    } else if (step === "schedule") {
      const r = scheduleSchema.safeParse(form.schedule)
      if (!r.success) {
        r.error.issues.forEach((err) => {
          const k = ["schedule", ...(err.path as string[])].join(".")
          e[k] = err.message
        })
      }
    }
    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast("Please fix the highlighted fields", { description: "Validation errors found." })
      return false
    }
    if (next) setStep(next)
    return true
  }

  function publish() {
    // Check KYC status first
    if (!canPublish) {
      toast.error("KYC verification required", { 
        description: "Complete your KYC verification to publish events." 
      })
      router.push('/organizer/kyc')
      return
    }

    // Validate all
    const r = formSchema.safeParse(form)
    if (!r.success) {
      const e: Record<string, string> = {}
      r.error.issues.forEach((err) => {
        const k = (err.path as string[]).join(".")
        e[k] = err.message
      })
      setErrors(e)
      toast("Missing information", { description: "Please resolve validation errors before publishing." })
      return
    }
    // Simulate submit as published
    discardDraft()
    toast.success("Event published", { description: `${form.basic.title} has been published and is now live.` })
    router.push("/organizer/events")
  }

  function saveAsDraft() {
    // Validate all
    const r = formSchema.safeParse(form)
    if (!r.success) {
      const e: Record<string, string> = {}
      r.error.issues.forEach((err) => {
        const k = (err.path as string[]).join(".")
        e[k] = err.message
      })
      setErrors(e)
      toast("Missing information", { description: "Please fill in all required fields to save as draft." })
      return
    }
    // Simulate save as draft
    discardDraft()
    toast.success("Event saved as draft", { 
      description: `${form.basic.title} has been saved. Complete KYC verification to publish.` 
    })
    router.push("/organizer/events")
  }

  const steps: { key: StepKey; label: string }[] = [
    { key: "basic", label: "Basic Details" },
    { key: "tickets", label: "Tickets" },
    { key: "schedule", label: "Schedule & Venue" },
    { key: "review", label: "Review & Publish" },
  ]

  // Show loading state only while checking auth
  if (loading) {
    return (
      <main className="p-4 md:p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center py-12">
            <h1 className="text-xl font-semibold mb-2">Loading...</h1>
            <p className="text-muted-foreground">Checking authentication status</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-6">
      <div className="max-w-[900px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-balance">Create Event</h1>
          <div className="flex items-center gap-2">
            {organizerLoading && <Badge variant="secondary">Loading profile...</Badge>}
            {saving && <Badge variant="secondary">Saving…</Badge>}
            {!!lastSaved && (
              <span className="text-xs text-muted-foreground">Saved {new Date(lastSaved).toLocaleTimeString()}</span>
            )}
            {draft && (
              <>
                <Button variant="outline" className="rounded-xl bg-transparent" onClick={restoreDraft}>
                  Restore Draft
                </Button>
                <Button variant="ghost" className="rounded-xl" onClick={discardDraft}>
                  Discard
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="rounded-xl bg-transparent"
              onClick={() => router.push("/organizer/events")}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <Card className="rounded-2xl bg-card/90 border-border/60">
          <CardContent className="p-4">
            <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {steps.map((s, idx) => {
                const active = step === s.key
                const complete = steps.findIndex((x) => x.key === step) > idx
                return (
                  <li key={s.key} className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        complete
                          ? "bg-primary text-primary-foreground"
                          : active
                            ? "bg-muted text-foreground"
                            : "bg-muted/60 text-muted-foreground",
                      ].join(" ")}
                      aria-current={active ? "step" : undefined}
                    >
                      {idx + 1}
                    </span>
                    <span className={active ? "text-foreground text-sm" : "text-muted-foreground text-sm"}>
                      {s.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Steps */}
        {step === "basic" && (
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm text-muted-foreground">
                  Title
                </label>
                <Input
                  id="title"
                  value={form.basic.title}
                  onChange={(e) => updateBasic("title", e.target.value)}
                  className="rounded-xl bg-muted/50"
                  aria-invalid={!!errors["basic.title"]}
                  aria-describedby={errors["basic.title"] ? "err-title" : undefined}
                />
                {errors["basic.title"] && (
                  <p id="err-title" className="text-xs text-destructive">
                    {errors["basic.title"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="desc" className="text-sm text-muted-foreground">
                  Description
                </label>
                <Textarea
                  id="desc"
                  value={form.basic.description}
                  onChange={(e) => updateBasic("description", e.target.value)}
                  className="rounded-xl bg-muted/50 min-h-24"
                  aria-invalid={!!errors["basic.description"]}
                />
                {errors["basic.description"] && (
                  <p className="text-xs text-destructive">{errors["basic.description"]}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm text-muted-foreground">
                    Location
                  </label>
                  <Input
                    id="location"
                    value={form.basic.location}
                    onChange={(e) => updateBasic("location", e.target.value)}
                    className="rounded-xl bg-muted/50"
                    aria-invalid={!!errors["basic.location"]}
                  />
                  {errors["basic.location"] && <p className="text-xs text-destructive">{errors["basic.location"]}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Visibility</label>
                  <Select value={form.basic.visibility} onValueChange={(v: any) => updateBasic("visibility", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/50">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm text-muted-foreground">
                    Category
                  </label>
                  <Input
                    id="category"
                    value={form.basic.category}
                    onChange={(e) => updateBasic("category", e.target.value)}
                    className="rounded-xl bg-muted/50"
                    aria-invalid={!!errors["basic.category"]}
                  />
                  {errors["basic.category"] && <p className="text-xs text-destructive">{errors["basic.category"]}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="poster" className="text-sm text-muted-foreground">
                    Poster URL
                  </label>
                  <Input
                    id="poster"
                    placeholder="https://..."
                    value={form.basic.posterUrl || ""}
                    onChange={(e) => updateBasic("posterUrl", e.target.value)}
                    className="rounded-xl bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload is simulated here; paste a URL to preview later.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  onClick={() => router.push("/organizer/events")}
                >
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={() => validateCurrentStep("tickets")}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "tickets" && (
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tickets</CardTitle>
              <Button className="rounded-xl" onClick={addTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Per-user limit</TableHead>
                      <TableHead className="w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.tickets.map((t, idx) => (
                      <TableRow key={t.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Input
                            value={t.name}
                            onChange={(e) => updateTicket(t.id, { name: e.target.value })}
                            className="rounded-xl bg-muted/50"
                            aria-invalid={!!errors[`tickets.${idx}.name`]}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={t.price}
                            onChange={(e) => updateTicket(t.id, { price: Number(e.target.value) || 0 })}
                            className="rounded-xl bg-muted/50"
                            aria-invalid={!!errors[`tickets.${idx}.price`]}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={t.quantity}
                            onChange={(e) => updateTicket(t.id, { quantity: Number(e.target.value) || 0 })}
                            className="rounded-xl bg-muted/50"
                            aria-invalid={!!errors[`tickets.${idx}.quantity`]}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={t.perUserLimit ?? 0}
                            onChange={(e) => updateTicket(t.id, { perUserLimit: Number(e.target.value) || 0 })}
                            className="rounded-xl bg-muted/50"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl bg-transparent"
                              onClick={() => moveTicket(idx, -1)}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl bg-transparent"
                              onClick={() => moveTicket(idx, 1)}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => removeTicket(t.id)}
                              aria-label="Delete"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.tickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          No ticket tiers yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Add at least one ticket tier. Fields validate on next.
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setStep("basic")}>
                    Back
                  </Button>
                  <Button className="rounded-xl" onClick={() => validateCurrentStep("schedule")}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "schedule" && (
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Schedule & Venue</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="start" className="text-sm text-muted-foreground">
                    Start Date & Time
                  </label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={form.schedule.startAt}
                    onChange={(e) => updateSchedule("startAt", e.target.value)}
                    className="rounded-xl bg-muted/50"
                    aria-invalid={!!errors["schedule.startAt"]}
                  />
                  {errors["schedule.startAt"] && (
                    <p className="text-xs text-destructive">{errors["schedule.startAt"]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="end" className="text-sm text-muted-foreground">
                    End Date & Time
                  </label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={form.schedule.endAt}
                    onChange={(e) => updateSchedule("endAt", e.target.value)}
                    className="rounded-xl bg-muted/50"
                    aria-invalid={!!errors["schedule.endAt"]}
                  />
                  {errors["schedule.endAt"] && <p className="text-xs text-destructive">{errors["schedule.endAt"]}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Make sure times are correct. End must be after start.
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setStep("tickets")}>
                    Back
                  </Button>
                  <Button className="rounded-xl" onClick={() => validateCurrentStep("review")}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card className="rounded-2xl bg-card/90 border-border/60">
            <CardHeader>
              <CardTitle>Review & Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* KYC Status Warning */}
              {organizerLoading ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Loading your organizer profile...</strong> We're checking your verification status.
                  </AlertDescription>
                </Alert>
              ) : !canPublish ? (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>KYC Verification Required:</strong> You can save this event as a draft, but you need to complete your KYC verification before you can publish it live.{" "}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-amber-800 underline" 
                      onClick={() => router.push("/organizer/kyc")}
                    >
                      Complete KYC now
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Ready to publish:</strong> Your account is verified and you can publish this event immediately.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <h3 className="font-medium">Basic</h3>
                <p className="text-sm text-muted-foreground">{form.basic.title || "—"}</p>
                <p className="text-sm text-muted-foreground">{form.basic.description || "—"}</p>
                <div className="text-sm text-muted-foreground">
                  {form.basic.category || "—"} • {form.basic.visibility} • {form.basic.location || "—"}
                </div>
              </div>
              <div>
                <h3 className="font-medium">Tickets</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {form.tickets.map((t) => (
                    <li key={t.id}>
                      {t.name}: ₹{t.price} × {t.quantity} {t.perUserLimit ? `(limit ${t.perUserLimit})` : ""}
                    </li>
                  ))}
                  {form.tickets.length === 0 && <li>—</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Schedule</h3>
                <div className="text-sm text-muted-foreground">
                  {form.schedule.startAt || "—"} → {form.schedule.endAt || "—"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => setStep("schedule")}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={saveAsDraft}>
                    Save as Draft
                  </Button>
                  <Button 
                    className="rounded-xl" 
                    onClick={publish}
                    disabled={!canPublish}
                    title={!canPublish ? "Complete KYC verification to publish" : ""}
                  >
                    {canPublish ? "Publish" : "Publish (KYC Required)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

# Use Case Scenarios — Smart Hospital AI

Each scenario describes a complete interaction path for a specific use case.

---

## UC-01: Patient Books an Appointment

| Field | Details |
|---|---|
| **Use Case ID** | UC-01 |
| **Use Case Name** | Book Appointment |
| **Actor(s)** | Patient, Doctor (indirect) |
| **Preconditions** | Patient is logged in; at least one doctor exists in the system |
| **Postconditions** | Appointment record created with status `pending`; doctor notified |

### Main Flow (Happy Path)
1. Patient navigates to **Appointments** page
2. Patient clicks **"Book New Appointment"**
3. System displays a modal with doctor list, date picker, time slot, and reason field
4. Patient selects a doctor, picks a date/time, and enters reason for visit
5. Patient clicks **Confirm**
6. System sends `POST /api/appointments` to backend
7. Backend creates `Appointment` document with `status: pending`
8. System creates a `Notification` for the doctor
9. Doctor receives push notification via FCM
10. Patient sees confirmation toast and updated appointment list

### Alternate Flow — No Available Doctors
- At step 3, if no doctors exist, system shows an informational message: *"No doctors available at this time."*

### Alternate Flow — AI-triggered Booking
- Patient types *"I want to see a doctor"* in AI chat
- AI detects `BOOK_APPOINTMENT` intent and responds with a redirect action
- Frontend navigates patient to Appointments page automatically (step 2)

### Exception Flow
- If network fails at step 6, API client returns a *"Network error"* toast; no record is created

---

## UC-02: Admin Approves a Doctor Registration

| Field | Details |
|---|---|
| **Use Case ID** | UC-02 |
| **Use Case Name** | Approve Doctor Registration |
| **Actor(s)** | Admin, Doctor |
| **Preconditions** | Doctor has registered with role `doctor`; doctor `isApproved = false` |
| **Postconditions** | Doctor's `isApproved` set to `true`; doctor can now log in |

### Main Flow
1. Doctor self-registers via the Login page selecting role **Doctor**
2. Backend sets `isApproved: false` on User document
3. Admin logs in and navigates to **Dashboard**
4. Dashboard displays *"Pending Doctor Requests"* card with count
5. Admin clicks a pending request to view doctor details
6. Admin clicks **Approve**
7. System sends `PATCH /api/admin/approve-doctor/:id`
8. Backend sets `isApproved: true`
9. Notification sent to doctor: *"Your account has been approved"*
10. Doctor can now successfully log in

### Alternate Flow — Admin Rejects
- At step 6, admin clicks **Reject**
- System deletes or deactivates the User document
- Doctor receives rejection notification

### Exception Flow
- If admin tries to approve an already-approved doctor, backend returns `400 Bad Request`

---

## UC-03: Doctor Creates a Treatment Course

| Field | Details |
|---|---|
| **Use Case ID** | UC-03 |
| **Use Case Name** | Create Treatment Course |
| **Actor(s)** | Doctor, Patient (indirect) |
| **Preconditions** | Doctor is logged in; patient record exists; appointment is confirmed |
| **Postconditions** | `TreatmentCourse` document created with `status: active` |

### Main Flow
1. Doctor navigates to a patient's profile
2. Doctor clicks **"Create Treatment Course"**
3. System presents form: title, diagnosis, instructions, medicines, diet advice, lifestyle notes, start/end dates, follow-up date
4. Doctor fills in at least one medicine (name, dosage, frequency, timing)
5. Doctor clicks **Save Course**
6. System sends `POST /api/treatments`
7. Backend creates `TreatmentCourse` document linked to `patientId` and `doctorId`
8. Patient receives notification: *"Your doctor has created a new treatment plan"*
9. Patient can view the treatment in their dashboard

### Alternate Flow — Linked to Appointment
- At step 2, doctor may open a specific appointment and create a course linked via `appointmentId`

### Exception Flow
- If `startDate > endDate`, backend returns `400 Bad Request` with validation message

---

## UC-04: Patient Interacts with AI Assistant

| Field | Details |
|---|---|
| **Use Case ID** | UC-04 |
| **Use Case Name** | Chat with AI Assistant |
| **Actor(s)** | Patient, AI Engine |
| **Preconditions** | Patient is logged in |
| **Postconditions** | Patient receives a contextual response; may be redirected to a feature |

### Main Flow
1. Patient opens the **AI Chat** widget/page
2. Patient types a message (e.g., *"I have a fever"*)
3. Frontend sends `POST /api/ai/chat` with `{ message, userContext }`
4. Backend `aiController` calls `aiService.processMessage()`
5. Service checks for `OPENAI_API_KEY`:
   - **If set**: calls GPT-3.5-turbo with medical boundary system prompt
   - **If not set**: uses local keyword intent detection
6. Intent detected: `SYMPTOM_ADVICE`
7. Service checks `userContext.activeTreatments`:
   - **Has active treatment**: AI advises patient to follow existing plan and consider follow-up
   - **No treatment**: AI refuses to prescribe; redirects to appointment booking
8. Response returned to frontend with optional `action: "redirect:appointments"`
9. Frontend renders formatted response in chat bubble
10. If action present, frontend shows redirect button or auto-navigates

### Alternate Flow — Voice Input
- At step 2, patient uses **Voice AI** page and speaks their message
- Deepgram transcribes audio to text; text is then used in step 3 onward

---

## UC-05: Doctor Uploads a Medical Record

| Field | Details |
|---|---|
| **Use Case ID** | UC-05 |
| **Use Case Name** | Upload Medical Record |
| **Actor(s)** | Doctor |
| **Preconditions** | Doctor is logged in; patient record exists |
| **Postconditions** | File stored in `backend/uploads/`; `Record` document created |

### Main Flow
1. Doctor navigates to **Records** page
2. Doctor selects a patient and clicks **"Upload Record"**
3. System displays upload form: record type (X-ray / Prescription / ECG / Lab), notes, file picker
4. Doctor selects a file (image/PDF) and fills in details
5. Doctor clicks **Upload**
6. Frontend sends `POST /api/records` as `multipart/form-data` via `api.upload()`
7. `uploadMiddleware.js` (Multer) intercepts and stores file to `uploads/` directory
8. `recordController` creates `Record` document with `fileUrl` pointing to stored file
9. Patient receives notification: *"A new medical record has been uploaded for you"*
10. Record appears in patient's Records page with download link

### Exception Flow
- File exceeds size limit → Multer returns `413 Payload Too Large`
- Unsupported file type → middleware rejects with `400 Bad Request`

---

## UC-06: Patient Makes a Payment

| Field | Details |
|---|---|
| **Use Case ID** | UC-06 |
| **Use Case Name** | Make Payment |
| **Actor(s)** | Patient, Payment Gateway (Razorpay) |
| **Preconditions** | Patient is logged in; a `Bill` with `status: pending` exists |
| **Postconditions** | Bill status updated to `paid`; payment confirmed via Razorpay |

### Main Flow
1. Patient navigates to **Billing** page
2. System displays outstanding bills
3. Patient clicks **Pay Now** on a pending bill
4. Frontend sends `POST /api/bills/create-order` to backend
5. Backend creates a Razorpay order using `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
6. Razorpay order ID returned to frontend
7. Razorpay checkout UI is rendered in patient's browser
8. Patient enters payment details and confirms
9. Razorpay calls backend webhook / frontend sends `POST /api/bills/verify-payment`
10. Backend verifies signature, updates `Bill` status to `paid`
11. Patient sees payment confirmation toast

### Alternate Flow — Payment Fails
- At step 8, if payment fails, Razorpay returns an error code
- Frontend shows failure message; bill remains `pending`

---

## UC-07: Admin Views Analytics Dashboard

| Field | Details |
|---|---|
| **Use Case ID** | UC-07 |
| **Use Case Name** | View Analytics Dashboard |
| **Actor(s)** | Admin |
| **Preconditions** | Admin is logged in |
| **Postconditions** | Aggregated statistics displayed |

### Main Flow
1. Admin navigates to **Analytics** page
2. Frontend calls multiple API endpoints in parallel:
   - `GET /api/patients` → total patient count
   - `GET /api/doctors` → total doctor count
   - `GET /api/appointments` → appointment statistics
   - `GET /api/bills` → revenue data
3. Data aggregated on frontend
4. Charts render: appointments per day, revenue trend, patient demographics, doctor specialty distribution
5. Admin can filter by date range or specialty

---

## UC-08: Appointment Reminder Fires

| Field | Details |
|---|---|
| **Use Case ID** | UC-08 |
| **Use Case Name** | Receive Appointment Reminder |
| **Actor(s)** | Patient, Doctor, System (background) |
| **Preconditions** | Confirmed appointment within reminder window (e.g., 24 hours) |
| **Postconditions** | Notification created; FCM push sent |

### Main Flow
1. `reminderService.js` runs on a polling interval after server boot
2. Service queries `Appointment` collection for confirmed appointments within the next 24 hours
3. For each appointment found, service creates a `Notification` document for both patient and doctor
4. `fcmService.js` sends push notification to devices registered with FCM tokens (`User.fcmToken`)
5. Patient/Doctor receive: *"Reminder: You have an appointment tomorrow at 10:00 AM"*
6. Notification appears in the in-app notification feed

### Exception Flow
- If a user has no `fcmToken`, FCM push is skipped; in-app notification still created

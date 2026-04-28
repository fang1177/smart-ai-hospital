# Structure Chart Diagram — Smart Hospital AI

## Overview

A **Structure Chart** shows the hierarchical decomposition of the system into modules, depicting function calls (control flow) between them. Arrows indicate caller → callee relationships. Data couples (parameters passed) and flags are annotated where key.

---

## Top-Level Structure Chart

```mermaid
flowchart TD
    MAIN["🏥 Smart Hospital AI\n(server.js)"]

    MAIN --> AUTH["Authentication\nModule\n(authRoutes)"]
    MAIN --> APPT["Appointment\nModule\n(appointmentRoutes)"]
    MAIN --> REC["Records\nModule\n(recordRoutes)"]
    MAIN --> TREAT["Treatment\nModule\n(treatmentRoutes)"]
    MAIN --> BILL["Billing\nModule\n(billRoutes)"]
    MAIN --> AI["AI Assistant\nModule\n(aiRoutes)"]
    MAIN --> NOTIF["Notification\nModule\n(notificationRoutes)"]
    MAIN --> ADMIN["Admin\nModule\n(adminRoutes)"]
    MAIN --> DOC["Doctor\nModule\n(doctorRoutes)"]
    MAIN --> PAT["Patient\nModule\n(patientRoutes)"]
```

---

## Authentication Module Decomposition

```mermaid
flowchart TD
    AUTH["Authentication\nModule"]

    AUTH --> REGISTER["register()\nauthController"]
    AUTH --> LOGIN["login()\nauthController"]

    REGISTER --> VALIDATE_REG["validateInput()\n— name, email, password, role"]
    REGISTER --> CHECK_EXIST["User.findOne(email)"]
    REGISTER --> HASH["bcrypt.hash(password)"]
    REGISTER --> CREATE_USER["User.create()"]
    REGISTER --> ISSUE_JWT_R["jwt.sign(payload)"]

    LOGIN --> FIND_USER["User.findOne(email)"]
    LOGIN --> CHECK_APPROVED["check isApproved\n(doctors only)"]
    LOGIN --> COMPARE_PW["user.comparePassword()"]
    LOGIN --> ISSUE_JWT_L["jwt.sign(payload)"]
```

---

## Appointment Module Decomposition

```mermaid
flowchart TD
    APPT["Appointment\nModule"]

    APPT --> BOOK["bookAppointment()\nappointmentController"]
    APPT --> LIST["getAppointments()\nappointmentController"]
    APPT --> CONFIRM["confirmAppointment()\nappointmentController"]
    APPT --> CANCEL["cancelAppointment()\nappointmentController"]

    BOOK --> AUTH_MW["authMiddleware\nverifyToken()"]
    BOOK --> CREATE_APPT["Appointment.create()"]
    BOOK --> NOTIFY_DOC["notifyUser(doctorId)\nnotificationController"]
    BOOK --> SEND_PUSH["fcmService\nsendPushNotification()"]

    CONFIRM --> AUTH_MW
    CONFIRM --> FIND_APPT["Appointment.findById()"]
    CONFIRM --> UPDATE_STATUS["appointment.status = confirmed"]
    CONFIRM --> NOTIFY_PAT["notifyUser(patientId)"]

    LIST --> AUTH_MW
    LIST --> QUERY_APPT["Appointment.find()\n.populate(doctor, patient)"]
```

---

## AI Assistant Module Decomposition

```mermaid
flowchart TD
    AI["AI Assistant\nModule"]

    AI --> CHAT["chat()\naiController"]

    CHAT --> AUTH_MW["authMiddleware\nverifyToken()"]
    CHAT --> BUILD_CTX["buildUserContext()\n— role, activeTreatments"]
    CHAT --> PROCESS["processMessage()\naiService"]

    PROCESS --> DETECT["detectIntent()\nkeyword engine"]
    PROCESS --> CHECK_KEY{"OPENAI_API_KEY\nconfigured?"}

    CHECK_KEY -- "Yes" --> CALL_GPT["fetch OpenAI\nGPT-3.5-turbo"]
    CHECK_KEY -- "No"  --> LOCAL["localReply()\nintent-based"]

    LOCAL --> CHECK_TREAT{"activeTreatments\nexist?"}
    CHECK_TREAT -- "Yes" --> AWARE_RESP["contextAwareResponse()\nadvise follow plan"]
    CHECK_TREAT -- "No"  --> REFUSE["refuseAndRedirect()\nbook appointment"]

    CALL_GPT --> PARSE_ACTION["parseActionTag()\n[ACTION:xxx]"]
    AWARE_RESP --> FORMAT["formatResponse()\nreply + action"]
    REFUSE     --> FORMAT
    PARSE_ACTION --> FORMAT

    CHAT -- "reply + action" --> CLIENT["Return JSON\nto Frontend"]
```

---

## Billing Module Decomposition

```mermaid
flowchart TD
    BILL["Billing\nModule"]

    BILL --> GEN_INV["generateBill()\nbillController"]
    BILL --> CREATE_ORD["createRazorpayOrder()\nbillController"]
    BILL --> VERIFY_PAY["verifyPayment()\nbillController"]
    BILL --> LIST_BILLS["getBills()\nbillController"]

    GEN_INV --> AUTH_MW["authMiddleware"]
    GEN_INV --> CREATE_BILL["Bill.create()"]

    CREATE_ORD --> AUTH_MW
    CREATE_ORD --> FIND_BILL["Bill.findById()"]
    CREATE_ORD --> RAZORPAY["razorpay.orders.create()"]

    VERIFY_PAY --> AUTH_MW
    VERIFY_PAY --> VERIFY_SIG["crypto.verify(signature)"]
    VERIFY_PAY --> UPDATE_BILL["Bill.status = paid"]
    VERIFY_PAY --> NOTIFY_PAT["notifyUser(patientId)"]
```

---

## Records Module Decomposition

```mermaid
flowchart TD
    REC["Records\nModule"]

    REC --> UPLOAD["uploadRecord()\nrecordController"]
    REC --> GET["getRecords()\nrecordController"]

    UPLOAD --> AUTH_MW["authMiddleware"]
    UPLOAD --> MULTER["uploadMiddleware\nmulter.single(file)"]
    UPLOAD --> SAVE_FILE["store to /uploads/"]
    UPLOAD --> CREATE_REC["Record.create()\nwith fileUrl"]
    UPLOAD --> NOTIFY_PAT["notifyUser(patientId)"]

    GET --> AUTH_MW
    GET --> QUERY_REC["Record.find()\n.populate(patient, doctor)"]
```

---

## Notification & Reminder Module Decomposition

```mermaid
flowchart TD
    NOTIF["Notification\nEngine"]

    NOTIF --> REMINDER["reminderService\nstartReminderService()"]
    NOTIF --> FCM_SVC["fcmService\nsendPushNotification()"]
    NOTIF --> NOTIF_CTRL["notificationController\ncreateNotification()"]

    REMINDER --> POLL["setInterval() — poll DB"]
    POLL --> FIND_SOON["Appointment.find()\nwithin 24h window"]
    FIND_SOON --> CREATE_NOTIF["Notification.create()"]
    CREATE_NOTIF --> FCM_SVC
    FCM_SVC --> FIREBASE["Firebase Admin SDK\nfirebase.messaging()"]
```

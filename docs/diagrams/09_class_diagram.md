# Class Diagram — Smart Hospital AI

## Overview

Shows all **Mongoose models** (mapped as classes), their attributes, methods, and relationships (associations, references, composition).

---

## Full Class Diagram

```mermaid
classDiagram

    %% ── USER ──────────────────────────────────────────────
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String role
        +String fcmToken
        +String avatar
        +Boolean isActive
        +Boolean isApproved
        +Date createdAt
        +Date updatedAt
        +comparePassword(plainPassword) Boolean
        +toJSON() Object
    }

    %% ── DOCTOR ────────────────────────────────────────────
    class Doctor {
        +ObjectId _id
        +ObjectId userId
        +String specialty
        +String qualifications
        +String phone
        +String bio
        +Date createdAt
        +Date updatedAt
    }

    %% ── PATIENT ───────────────────────────────────────────
    class Patient {
        +ObjectId _id
        +ObjectId userId
        +String phone
        +String gender
        +String dateOfBirth
        +String bloodGroup
        +String address
        +Date createdAt
        +Date updatedAt
    }

    %% ── APPOINTMENT ───────────────────────────────────────
    class Appointment {
        +ObjectId _id
        +ObjectId patientId
        +ObjectId doctorId
        +String date
        +String time
        +String reason
        +String status
        +String notes
        +Date createdAt
        +Date updatedAt
    }

    %% ── RECORD ────────────────────────────────────────────
    class Record {
        +ObjectId _id
        +ObjectId patientId
        +ObjectId doctorId
        +String type
        +String fileUrl
        +String notes
        +Date createdAt
        +Date updatedAt
    }

    %% ── TREATMENT COURSE ──────────────────────────────────
    class TreatmentCourse {
        +ObjectId _id
        +ObjectId patientId
        +ObjectId doctorId
        +ObjectId appointmentId
        +String title
        +String diagnosis
        +String instructions
        +Medicine[] medicines
        +String dietAdvice
        +String lifestyleNotes
        +String followUpDate
        +String startDate
        +String endDate
        +String status
        +Date createdAt
        +Date updatedAt
    }

    %% ── MEDICINE (Embedded Sub-document) ──────────────────
    class Medicine {
        +String name
        +String dosage
        +String frequency
        +String timing
        +String notes
    }

    %% ── BILL ──────────────────────────────────────────────
    class Bill {
        +ObjectId _id
        +ObjectId patientId
        +ObjectId doctorId
        +BillItem[] items
        +Number total
        +String status
        +String razorpayOrderId
        +String razorpayPaymentId
        +Date createdAt
        +Date updatedAt
    }

    %% ── BILL ITEM (Embedded Sub-document) ─────────────────
    class BillItem {
        +String description
        +Number amount
    }

    %% ── NOTIFICATION ──────────────────────────────────────
    class Notification {
        +ObjectId _id
        +ObjectId userId
        +String message
        +String type
        +Boolean isRead
        +Date createdAt
        +Date updatedAt
    }

    %% ── SERVICE CLASSES ───────────────────────────────────
    class AIService {
        +detectIntent(text) String
        +localReply(intent, text, userContext) Object
        +processMessage(message, userContext) Promise~Object~
    }

    class ReminderService {
        +startReminderService() void
        -pollAppointments() void
        -sendReminders(appointments) void
    }

    class FCMService {
        +sendPushNotification(token, title, body) Promise~void~
    }

    %% ── RELATIONSHIPS ─────────────────────────────────────

    %% Inheritance / Profile link
    User "1" --> "0..1" Doctor      : has profile
    User "1" --> "0..1" Patient     : has profile

    %% Appointment
    Patient "1" --> "0..*" Appointment  : books
    Doctor  "1" --> "0..*" Appointment  : receives

    %% Records
    Patient "1" --> "0..*" Record       : has records
    Doctor  "1" --> "0..*" Record       : uploads

    %% Treatment
    Patient "1" --> "0..*" TreatmentCourse  : assigned to
    Doctor  "1" --> "0..*" TreatmentCourse  : creates
    Appointment "0..1" --> "0..1" TreatmentCourse : linked to

    %% Composition (embedded docs)
    TreatmentCourse "1" *-- "0..*" Medicine   : contains
    Bill            "1" *-- "1..*" BillItem   : contains

    %% Billing
    Patient "1" --> "0..*" Bill   : billed to
    Doctor  "1" --> "0..*" Bill   : generates

    %% Notifications
    User "1" --> "0..*" Notification : receives

    %% Services
    ReminderService ..> Appointment     : queries
    ReminderService ..> Notification    : creates
    ReminderService ..> FCMService      : uses
    AIService       ..> TreatmentCourse : reads context
    AIService       ..> User            : reads role
```

---

## Relationship Summary

| Relationship | Type | Multiplicity |
|---|---|---|
| User → Doctor | Association (profile) | 1 to 0..1 |
| User → Patient | Association (profile) | 1 to 0..1 |
| Patient → Appointment | Association | 1 to 0..* |
| Doctor → Appointment | Association | 1 to 0..* |
| Patient → Record | Association | 1 to 0..* |
| Doctor → Record | Association | 1 to 0..* |
| Patient → TreatmentCourse | Association | 1 to 0..* |
| Doctor → TreatmentCourse | Association | 1 to 0..* |
| Appointment → TreatmentCourse | Association (optional link) | 0..1 to 0..1 |
| TreatmentCourse → Medicine | **Composition** (embedded) | 1 to 0..* |
| Patient → Bill | Association | 1 to 0..* |
| Doctor → Bill | Association | 1 to 0..* |
| Bill → BillItem | **Composition** (embedded) | 1 to 1..* |
| User → Notification | Association | 1 to 0..* |
| ReminderService → FCMService | **Dependency** | — |
| AIService → TreatmentCourse | **Dependency** (read context) | — |

---

## Attribute Enumerations

### `User.role`
```
admin | doctor | patient
```

### `Appointment.status`
```
pending | confirmed | cancelled | completed
```

### `TreatmentCourse.status`
```
active | completed | cancelled
```

### `Bill.status`
```
pending | paid | cancelled
```

### `Record.type`
```
xray | prescription | ecg | lab | other
```

### `Notification.type`
```
appointment | record | treatment | billing | system
```

# Object Diagram — Smart Hospital AI

## Overview

An **Object Diagram** is a snapshot of the system at a specific point in time, showing **concrete instances** of classes with real example values. This represents a typical scenario: *Dr. Sarah confirms a patient appointment, an active treatment course exists, and an unpaid bill is pending.*

---

## Scenario: Patient Consults Doctor — Runtime Snapshot

```mermaid
classDiagram

    %% ── OBJECT INSTANCES ──────────────────────────────────

    class `u1 : User` {
        _id = "64a1f0001"
        name = "Arjun Mehta"
        email = "arjun@email.com"
        role = "patient"
        isApproved = true
        isActive = true
        fcmToken = "fcm_token_arjun_xyz"
    }

    class `u2 : User` {
        _id = "64a1f0002"
        name = "Dr. Sarah Khan"
        email = "sarah@hospital.com"
        role = "doctor"
        isApproved = true
        isActive = true
        fcmToken = "fcm_token_sarah_abc"
    }

    class `u3 : User` {
        _id = "64a1f0003"
        name = "Admin Root"
        email = "admin@hospital.com"
        role = "admin"
        isApproved = true
        isActive = true
        fcmToken = null
    }

    class `pat1 : Patient` {
        _id = "64b2c0001"
        userId = "64a1f0001"
        phone = "+91-9876543210"
        gender = "male"
        dateOfBirth = "1995-06-15"
        bloodGroup = "B+"
        address = "12 Park Street, Mumbai"
    }

    class `doc1 : Doctor` {
        _id = "64b2c0002"
        userId = "64a1f0002"
        specialty = "Cardiology"
        qualifications = "MBBS, MD Cardiology"
        phone = "+91-9988776655"
        bio = "15 years experience in cardiac care"
    }

    class `appt1 : Appointment` {
        _id = "64c3d0001"
        patientId = "64b2c0001"
        doctorId = "64b2c0002"
        date = "2026-04-25"
        time = "10:30 AM"
        reason = "Chest pain and shortness of breath"
        status = "confirmed"
        notes = "Fasting required before visit"
    }

    class `tc1 : TreatmentCourse` {
        _id = "64d4e0001"
        patientId = "64b2c0001"
        doctorId = "64b2c0002"
        appointmentId = "64c3d0001"
        title = "Cardiac Monitoring Protocol"
        diagnosis = "Mild angina - stable"
        instructions = "Avoid strenuous activity, rest for 2 weeks"
        dietAdvice = "Low sodium diet, avoid saturated fats"
        lifestyleNotes = "30 min light walk daily"
        startDate = "2026-04-25"
        endDate = "2026-05-25"
        followUpDate = "2026-05-10"
        status = "active"
    }

    class `med1 : Medicine` {
        name = "Aspirin"
        dosage = "75mg"
        frequency = "Once daily"
        timing = "After breakfast"
        notes = "Do not skip"
    }

    class `med2 : Medicine` {
        name = "Atorvastatin"
        dosage = "20mg"
        frequency = "Once daily"
        timing = "At bedtime"
        notes = "Monitor liver enzymes monthly"
    }

    class `rec1 : Record` {
        _id = "64e5f0001"
        patientId = "64b2c0001"
        doctorId = "64b2c0002"
        type = "ecg"
        fileUrl = "/uploads/ecg_arjun_20260425.pdf"
        notes = "Normal sinus rhythm, mild ST changes"
    }

    class `bill1 : Bill` {
        _id = "64f6g0001"
        patientId = "64b2c0001"
        doctorId = "64b2c0002"
        total = 2500
        status = "pending"
        razorpayOrderId = null
        razorpayPaymentId = null
    }

    class `bi1 : BillItem` {
        description = "Consultation Fee"
        amount = 1500
    }

    class `bi2 : BillItem` {
        description = "ECG Report"
        amount = 1000
    }

    class `notif1 : Notification` {
        _id = "64g7h0001"
        userId = "64b2c0001"
        message = "Your appointment with Dr. Sarah Khan is confirmed for Apr 25"
        type = "appointment"
        isRead = false
    }

    class `notif2 : Notification` {
        _id = "64g7h0002"
        userId = "64a1f0002"
        message = "New appointment request from Arjun Mehta on Apr 25 at 10:30 AM"
        type = "appointment"
        isRead = true
    }

    class `notif3 : Notification` {
        _id = "64g7h0003"
        userId = "64b2c0001"
        message = "Dr. Sarah Khan has created your treatment plan: Cardiac Monitoring Protocol"
        type = "treatment"
        isRead = false
    }

    %% ── LINKS (Instance Relationships) ───────────────────

    `u1 : User`          --> `pat1 : Patient`       : profileOf
    `u2 : User`          --> `doc1 : Doctor`         : profileOf
    `pat1 : Patient`     --> `appt1 : Appointment`   : books
    `doc1 : Doctor`      --> `appt1 : Appointment`   : attends
    `appt1 : Appointment` --> `tc1 : TreatmentCourse` : linkedTo
    `pat1 : Patient`     --> `tc1 : TreatmentCourse` : assignedTo
    `doc1 : Doctor`      --> `tc1 : TreatmentCourse` : creates
    `tc1 : TreatmentCourse` *-- `med1 : Medicine`    : contains
    `tc1 : TreatmentCourse` *-- `med2 : Medicine`    : contains
    `pat1 : Patient`     --> `rec1 : Record`          : has
    `doc1 : Doctor`      --> `rec1 : Record`          : uploaded
    `pat1 : Patient`     --> `bill1 : Bill`            : billedTo
    `doc1 : Doctor`      --> `bill1 : Bill`            : generated
    `bill1 : Bill`       *-- `bi1 : BillItem`          : contains
    `bill1 : Bill`       *-- `bi2 : BillItem`          : contains
    `u1 : User`          --> `notif1 : Notification`  : receives
    `u2 : User`          --> `notif2 : Notification`  : receives
    `u1 : User`          --> `notif3 : Notification`  : receives
```

---

## Instance State Summary

| Object | Class | Key State |
|---|---|---|
| `u1` | User | Patient — approved, active |
| `u2` | User | Doctor (Cardiologist) — approved, active |
| `u3` | User | Admin — approved, active |
| `pat1` | Patient | Arjun Mehta, B+ blood group |
| `doc1` | Doctor | Dr. Sarah Khan, Cardiology |
| `appt1` | Appointment | Confirmed for 25 Apr 2026, 10:30 AM |
| `tc1` | TreatmentCourse | Active — Cardiac Monitoring Protocol |
| `med1` | Medicine | Aspirin 75mg, once daily |
| `med2` | Medicine | Atorvastatin 20mg, at bedtime |
| `rec1` | Record | ECG uploaded as PDF |
| `bill1` | Bill | ₹2500 pending payment |
| `bi1` | BillItem | Consultation Fee — ₹1500 |
| `bi2` | BillItem | ECG Report — ₹1000 |
| `notif1` | Notification | Appointment confirmed (unread) |
| `notif2` | Notification | Appointment request (read by doctor) |
| `notif3` | Notification | Treatment plan created (unread) |

---

> [!NOTE]
> All `ObjectId` values are illustrative hex strings for documentation purposes. In MongoDB, these are 24-character BSON ObjectIds (e.g., `64a1f000000000000000001`).

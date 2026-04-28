# Data Flow Diagram — Smart Hospital AI

## Level 0: Context Diagram (DFD)

> Shows the system as a single process and all external entities interacting with it.

```mermaid
flowchart LR
    Patient(["🧑 Patient"])
    Doctor(["👨‍⚕️ Doctor"])
    Admin(["👤 Admin"])
    Razorpay(["💳 Razorpay"])
    OpenAI(["🤖 OpenAI API"])
    Deepgram(["🎙️ Deepgram"])
    FCM(["🔔 Firebase FCM"])

    SH["⬛ Smart Hospital AI\nSystem"]

    Patient -- "Registration, Login, Appointment Request,\nChat Message, Payment" --> SH
    SH -- "Auth Token, Records, AI Response,\nAppointment Status, Notifications" --> Patient

    Doctor -- "Login, Appointment Confirmation,\nRecord Upload, Treatment Course" --> SH
    SH -- "Auth Token, Patient Data,\nAppointments, Notifications" --> Doctor

    Admin -- "Login, Doctor Approval,\nUser Management" --> SH
    SH -- "Analytics Data, Pending Requests,\nSystem Reports" --> Admin

    SH -- "Order Creation Request" --> Razorpay
    Razorpay -- "Payment Confirmation / Failure" --> SH

    SH -- "Chat Completion Request" --> OpenAI
    OpenAI -- "AI Generated Response" --> SH

    SH -- "Audio Stream" --> Deepgram
    Deepgram -- "Transcription Text" --> SH

    SH -- "Push Notification Payload" --> FCM
    FCM -- "Delivery Status" --> SH
```

---

## Level 1: Main System Processes

> Breaks the system into its major processing modules and shows data flows between them.

```mermaid
flowchart TD
    %% External Entities
    Patient(["🧑 Patient"])
    Doctor(["👨‍⚕️ Doctor"])
    Admin(["👤 Admin"])
    ExtAI(["🤖 OpenAI API"])
    ExtPay(["💳 Razorpay"])
    ExtPush(["🔔 FCM"])

    %% Processes
    P1["1.0\nAuthentication\n& Authorization"]
    P2["2.0\nAppointment\nManagement"]
    P3["3.0\nMedical Records\nManagement"]
    P4["4.0\nTreatment Course\nManagement"]
    P5["5.0\nAI Assistant\nProcessing"]
    P6["6.0\nBilling &\nPayment"]
    P7["7.0\nNotification\nEngine"]
    P8["8.0\nAdmin &\nAnalytics"]

    %% Data Stores
    DS1[("DS1\nUsers")]
    DS2[("DS2\nAppointments")]
    DS3[("DS3\nRecords")]
    DS4[("DS4\nTreatment\nCourses")]
    DS5[("DS5\nBills")]
    DS6[("DS6\nNotifications")]

    %% Auth flows
    Patient -- "credentials / register data" --> P1
    Doctor  -- "credentials / register data" --> P1
    Admin   -- "credentials"                 --> P1
    P1 -- "read/write user"   --> DS1
    P1 -- "JWT token"         --> Patient
    P1 -- "JWT token"         --> Doctor
    P1 -- "JWT token"         --> Admin

    %% Appointment flows
    Patient -- "appointment request"       --> P2
    Doctor  -- "confirm/cancel"            --> P2
    P2 -- "read available doctors"        --> DS1
    P2 -- "write appointment"             --> DS2
    P2 -- "read appointments"             --> DS2
    P2 -- "appointment data"              --> Patient
    P2 -- "appointment data"              --> Doctor
    P2 -- "trigger notification"          --> P7

    %% Records flows
    Doctor  -- "upload file + metadata"   --> P3
    Patient -- "view request"             --> P3
    P3 -- "write record"                  --> DS3
    P3 -- "read records"                  --> DS3
    P3 -- "record list / file URL"        --> Patient
    P3 -- "trigger notification"          --> P7

    %% Treatment flows
    Doctor  -- "treatment course data"    --> P4
    Patient -- "view request"             --> P4
    P4 -- "write treatment"               --> DS4
    P4 -- "read treatments"               --> DS4
    P4 -- "treatment details"             --> Patient
    P4 -- "active treatment context"      --> P5
    P4 -- "trigger notification"          --> P7

    %% AI flows
    Patient -- "chat message / voice"     --> P5
    P5 -- "read active treatments"        --> DS4
    P5 -- "read user context"             --> DS1
    P5 -- "completion request"            --> ExtAI
    ExtAI -- "AI response"                --> P5
    P5 -- "formatted response + action"   --> Patient

    %% Billing flows
    Patient -- "pay bill request"         --> P6
    Doctor  -- "generate invoice"         --> P6
    P6 -- "write bill"                    --> DS5
    P6 -- "read bill"                     --> DS5
    P6 -- "create order"                  --> ExtPay
    ExtPay -- "payment result"            --> P6
    P6 -- "bill status update"            --> DS5
    P6 -- "payment confirmation"          --> Patient
    P6 -- "trigger notification"          --> P7

    %% Notification flows
    P7 -- "write notification"            --> DS6
    P7 -- "push payload"                  --> ExtPush
    ExtPush -- "delivery ack"             --> P7
    Patient -- "read notifications"       --> P7
    Doctor  -- "read notifications"       --> P7
    P7 -- "notification list"             --> DS6

    %% Admin flows
    Admin -- "approve doctor / manage"    --> P8
    P8 -- "read/write users"              --> DS1
    P8 -- "read appointments"             --> DS2
    P8 -- "read bills"                    --> DS5
    P8 -- "analytics data"                --> Admin
```

---

## Level 2: AI Assistant Process (Detail)

> Expands Process 5.0 — AI Assistant Processing.

```mermaid
flowchart TD
    Patient(["🧑 Patient"])
    OpenAI(["🤖 OpenAI API"])
    DS4[("DS4 Treatment Courses")]
    DS1[("DS1 Users")]

    P5_1["5.1\nReceive Message\n& User Context"]
    P5_2["5.2\nDetect Intent\n(Keyword Engine)"]
    P5_3{"5.3\nOpenAI Key\nConfigured?"}
    P5_4["5.4\nCall GPT-3.5-turbo\nwith System Prompt"]
    P5_5["5.5\nLocal Intent\nResponse Builder"]
    P5_6{"5.6\nActive Treatment\nExists?"}
    P5_7["5.7\nContext-Aware\nMedical Response"]
    P5_8["5.8\nRefuse & Redirect\nto Appointment"]
    P5_9["5.9\nParse Action Tag\n& Format Response"]

    Patient -- "message + userContext" --> P5_1
    P5_1 -- "fetch active treatments" --> DS4
    P5_1 -- "fetch user role"         --> DS1
    P5_1 --> P5_2
    P5_2 -- "detected intent"         --> P5_3

    P5_3 -- "Yes"                     --> P5_4
    P5_3 -- "No"                      --> P5_5

    P5_4 -- "completion request"      --> OpenAI
    OpenAI -- "raw response"          --> P5_9

    P5_5 -- "intent = SYMPTOM_ADVICE" --> P5_6
    P5_5 -- "other intents"           --> P5_9

    P5_6 -- "Yes"                     --> P5_7
    P5_6 -- "No"                      --> P5_8

    P5_7 --> P5_9
    P5_8 --> P5_9

    P5_9 -- "reply + action"          --> Patient
```

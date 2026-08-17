# Sunrise Community Savings

A digital community savings and fund-management platform designed for small groups that contribute a fixed amount every week and collectively manage savings, dues, fines, loans, announcements, and community expenses.

> **Project status:** Active development / prototype

## Overview

Sunrise Community digitizes a traditional community savings system.

Members contribute **₹50 every Sunday**. Late payments can receive a **₹10 fine**, while members can request loans from the community fund with interest calculated according to the organization's rules.

The application provides each member with a bank-style account experience while giving community leaders tools to manage the organization.

## Features

### Authentication
- Email/password registration and login
- Firebase Authentication
- Email verification
- Password reset
- Google sign-in
- Automatic user synchronization with the database

### Member Accounts
- Personal dashboard
- Account balance
- Weekly payment history
- Pending dues
- Fines
- Loan balance
- Transaction history
- Profile photo
- Member role

### Weekly Savings
- Automatic weekly dues
- ₹50 default contribution
- Payment status tracking
- Paid / Pending / Late states
- Automatic fine calculation
- Payment records and receipts

### Financial Statements
Bank-style transaction history including:

- Weekly deposits
- Fines
- Loan disbursements
- Loan repayments
- Interest
- Adjustments

### Loans
Members can:

- Request a loan
- Specify the requested amount
- Provide a reason
- Track loan status
- View outstanding balance
- Make repayments

Authorized leaders can:

- Review requests
- Approve/reject loans
- Set approved amounts
- Track active loans

### Announcements
Leaders and Co-Leaders can publish announcements.

Members can:

- View announcements
- Like announcements
- Comment on announcements
- Receive announcement notifications

### Roles

| Role | Permissions |
|---|---|
| Leader | Full organization management |
| Co-Leader | Administrative management |
| Manager | Operational management |
| Member | Personal account and community features |

### Notifications

Supports notifications for:

- Weekly payment reminders
- Payment confirmations
- Fines
- Loan requests
- Loan approvals/rejections
- Announcements
- General notifications

### Admin Dashboard

Authorized administrators can view:

- Total members
- Total collections
- Pending dues
- Outstanding loans
- Fine collection
- Monthly collection statistics
- Loan statistics

### Online Payments

The application integrates with **Razorpay** for online payment processing.

Payment flow:

```text
Member
   ↓
Select Due
   ↓
Create Razorpay Order
   ↓
Complete Payment
   ↓
Verify Razorpay Signature
   ↓
Mark Due as Paid
   ↓
Create Transaction
```

### Automated Reminders

A scheduled API endpoint can generate weekly payment reminders for active members.



### Technology Stack

~ Frontend
~ Next.js
~ React
~ TypeScript
~ Tailwind CSS
~ shadcn/ui

### Backend

~ Next.js API Routes
~ Prisma ORM
~ PostgreSQL
~ Firebase Admin SDK

### Authentication

~ Firebase Authentication

### Storage

~ Cloudinary

### Payments

~ Razorpay

### Mobile

~ Capacitor
~ Android
Deployment

### Designed for deployment using:

~ Vercel
~ PostgreSQL hosting such as Neon/Supabase/Aiven
~ Firebase
~ Cloudinary
~ Razorpay


## Project Structure

```text
community_savings/
│
├── app/
│   ├── api/
│   │   ├── admin/
│   │   ├── announcements/
│   │   ├── auth/
│   │   ├── collection/
│   │   ├── cron/
│   │   ├── dues/
│   │   ├── loans/
│   │   ├── members/
│   │   ├── notifications/
│   │   ├── payments/
│   │   └── transactions/
│   │
│   ├── dashboard/
│   ├── login/
│   ├── register/
│   └── ...
│
├── android/
│   └── Capacitor Android project
│
├── components/
│   └── Reusable UI components
│
├── hooks/
│   └── React hooks
│
├── lib/
│   ├── auth.ts
│   ├── cloudinary.ts
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── prisma.ts
│   ├── razorpay.ts
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   └── Static assets
│
├── capacitor.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Database

The application uses PostgreSQL with Prisma.

### Main models include:

User
WeeklyPayment
Loan
LoanRepayment
Transaction
Announcement
Comment
Like
Notification
Settings

### The system supports organization-wide settings such as:

Weekly contribution: ₹50
Late fine: ₹10
Loan unit: ₹500
Loan interest: ₹10 per ₹500

These values are configurable through the Settings model.


# Getting Started
## Requirements

### Install:

~ Node.js
~ npm
~ PostgreSQL
~ Firebase project
~ Cloudinary account
~ Razorpay account

### For Android development:

~ Android Studio
~ Android SDK
~ JDK
~ Capacitor Android tooling

## Installation

### Clone the repository:

git clone https://github.com/arunbharathm01-bit/community_savings.git
cd community_savings

### Install dependencies:

npm install


### Environment Variables

Create:

.env.local

Never commit this file.

Example:

```text
DATABASE_URL="postgresql://..."


NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."


FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."


NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="..."


RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="..."


CRON_SECRET="..."
```

## Security

### Never commit:

.env
.env.local
.env.production
Firebase service-account JSON
Private keys
Razorpay secrets
Cloudinary API secrets
Database credentials
Keystores
APK signing keys


### Database Setup

Generate Prisma Client:

npx prisma generate

Run database migrations:

npx prisma migrate dev

For development seed data:

npx prisma db seed

Inspect the database:

npx prisma studio


### Development

Start the development server:

npm run dev

Open:

http://localhost:3000


### Production Build

Build:

npm run build

Start:

npm start


## Android Application

The project uses Capacitor to package the web application as an Android application.

## Sync the Android project:

npx cap sync android

## Open Android Studio:

npx cap open android

Build the Android application from Android Studio or Gradle.

For a production Android application, make sure the application uses a production backend/API URL and does not depend on:

http://localhost:3000


## API Overview

### The application contains API routes for:

```text
/api/auth
/api/admin
/api/announcements
/api/collection
/api/cron
/api/dues
/api/loans
/api/members
/api/notifications
/api/payments
/api/transactions
```

Authentication uses Firebase ID tokens.

### Protected API requests use:

Authorization: Bearer <firebase-id-token>

Server-side authentication is verified using Firebase Admin.


### Role-Based Access Control

The application implements role-based access control.

LEADER
   ↓
CO_LEADER
   ↓
MANAGER
   ↓
MEMBER

API authorization is performed server-side rather than relying only on frontend UI restrictions.


### Development Test Accounts

The development seed includes sample accounts for testing.

Example roles:

Leader
Co-Leader
Manager
Member

These accounts are for development/testing only.

Do not use development credentials in production.


### Financial Safety

This project is currently intended as a community/project application and should not be considered production-ready financial software without additional security and compliance work.

Before handling real money, the following should be reviewed:

Server-side payment amount validation
Payment ownership validation
Razorpay webhook verification
Transaction idempotency
Audit logs
Decimal-based monetary values
Database transaction safety
Role authorization
Rate limiting
Fraud prevention
Backup and recovery
Access control
Production secret management
Applicable Indian financial/legal requirements

Never trust monetary values supplied directly by the client.


## Roadmap
Completed / In Development
 Authentication
 Firebase integration
 Member accounts
 Role system
 Weekly dues
 Fines
 Transaction history
 Loan management
 Announcements
 Comments
 Likes
 Notifications
 Admin statistics
 PostgreSQL + Prisma
 Razorpay integration
 Capacitor Android project
Planned
 AutoPay
 Complete audit log
 PDF statements
 Excel/CSV exports
 QR-based payments
 Expense management
 Community voting/polls
 Advanced reports
 Push notifications
 Improved Android production build
 Automated tests
 CI/CD
 Production security audit


## Contributing

This project is primarily developed for a private community savings use case.

### For development:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test locally.
5. Submit a pull request.

Do not submit credentials, private keys, database dumps, or real member financial information.


### License

This project is currently maintained as a personal/community project.

Add an explicit open-source license before accepting external contributions or redistributing the application.


### Author

Arun

GitHub:

https://github.com/arunbharathm01-bit

Repository:

https://github.com/arunbharathm01-bit/community_savings

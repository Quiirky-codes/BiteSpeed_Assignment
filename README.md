# Bitespeed Identity Reconciliation Service

## Overview

This project implements the Identity Reconciliation backend task for Bitespeed. The service consolidates customer contact information across multiple purchases by linking records that share common email addresses or phone numbers.

The system ensures that each customer is represented by a single primary contact while maintaining historical secondary contacts. The solution is designed with production-grade considerations including transactional safety, deterministic merging, and PostgreSQL support.

---

## Problem Statement

Customers may place orders using different combinations of email addresses and phone numbers. The system must:

* Identify whether incoming contact information belongs to an existing customer.

* Link related contacts together.

* Maintain the oldest contact as the primary record.

* Return a consolidated view of the customer identity.

---

## Key Features

* Deterministic identity reconciliation

* Oldest-contact primary selection

* Automatic secondary contact creation

* Primary-to-secondary merging when required

* Transaction-safe operations

* PostgreSQL with SSL support (Render compatible)

* Deduplicated response formatting

* Production-ready layered architecture

---

## Tech Stack

* Node.js

* TypeScript

* Express.js

* PostgreSQL

* pg (node-postgres)

* Render (deployment)

---

## System Design

### High-Level Flow

1. Client sends POST `/identify` with email and/or phone.

2. Service searches for existing matching contacts.

3. If no match exists:

  * Create a new primary contact.

4. If matches exist:

  * Resolve all linked contacts.

  * Determine the oldest primary.

  * Merge conflicting primaries if necessary.

  * Create a secondary contact if new information is introduced.

5. Return consolidated contact view.

### Identity Resolution Rules

* Contacts are linked if email OR phone matches.

* The oldest contact is always the primary.

* New information results in creation of a secondary contact.

* Exact duplicate requests do not create new records.

* All operations run inside a database transaction.

### Database Schema

#### Table: contacts

|Column	| Type	| Description |
|-------|-------|-------------|
| cid	| SERIAL	| Primary key |
| email	| TEXT	| Customer email |
| phone_number | TEXT | Customer phone |
| linked_id	| INT | Points to primary contact | 
| link_precedence | TEXT | primary or secondary | 
| created_at | TIMESTAMP | Creation time | 
| updated_at | TIMESTAMP | Last update |
| cdeleted_at | TIMESTAMP | Soft delete (unused) |

**Indexes are created on:**

* email

* phone_number

* linked_id

---

## Project Structure

```

bitespeed_identity/
├── src/
│   ├── config/
│   │   └── db.postgres.ts
│   ├── controllers/
│   │   └── identify.controller.ts
│   ├── repositories/
│   │   └── contact.repository.ts
│   ├── routes/
│   │   └── identify.routes.ts
│   ├── services/
│   │   └── identity.service.ts
│   ├── types/
│   │   └── contact.types.ts
│   └── server.ts
├── migrations/
│   └── init.sql
├── tests/
├── .env.example
├── Dockerfile
├── package.json
└── README.md

```

## API Specification

### Endpoint

```

POST /identify

```

### Request Body (JSON)

At least one field must be provided.

```

{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}

```
> Note: The API accepts JSON body only (not form-data).

### Response Format

```

{
  "contact": {
    "primaryContatctId": number,
    "emails": string[],
    "phoneNumbers": string[],
    "secondaryContactIds": number[]
  }
}

```

### Example

#### Request

<img width="2052" height="514" alt="image" src="https://github.com/user-attachments/assets/4e7f9c65-0560-4e5a-843e-7e865f0b107c" />

#### Response

<img width="2054" height="614" alt="image" src="https://github.com/user-attachments/assets/8d86cfc8-dcfe-4027-93d7-de64416d0f43" />

---

## Local Setup Instructions

#### 1. Clone the repository

```

git clone <your-repo-url>

cd bitespeed_identity

```

#### 2. Install dependencies

```

npm install

```

#### 3. Configure environment variables

**Create a .env file from the example:**

```

cp .env.example .env

```

> Update values accordingly.

#### 4. Setup PostgreSQL

**Create database**

```

psql -U <user> -d bitespeed -f migrations/init.sql

```
#### 5. Run the server

#### Development:

```

npm run dev

```

**Production build:**

```

npm run build

npm run start

```

**Server runs on:**


http://localhost:3000

#### Deployment

The application is deployed on Render with managed PostgreSQL.

**Live Endpoint**

```

POST https://<your-render-url>/identify

```

---

## Production Considerations

The implementation includes:

* Database transaction safety

* Primary conflict resolution

* Deterministic ordering

* Unique response guarantees

* PostgreSQL SSL support

* Connection pooling

* Layered architecture

---

## Assumptions

* Email and phone are treated as exact matches.

* At least one of email or phone is always provided.

* Soft deletes are not actively used but supported in schema.

* Phone numbers are stored as strings to preserve formatting.

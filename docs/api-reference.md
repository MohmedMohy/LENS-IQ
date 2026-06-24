# API Reference

Base URL: `http://localhost:3000` (dev) or `https://your-app.railway.app` (prod)

All requests must include `Content-Type: application/json`.
Authenticated endpoints require `Authorization: Bearer <token>` or `x-api-key: <key>`.

---

## Authentication

### POST /auth/register

Register a new tenant account.

```json
{
  "name": "My Dealership",
  "email": "admin@dealership.com",
  "password": "securepassword123"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Dealership",
    "email": "admin@dealership.com",
    "api_key": "abc123...",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/login

Authenticate and receive a JWT token.

```json
{
  "email": "admin@dealership.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tenant": {
      "id": 1,
      "name": "My Dealership",
      "email": "admin@dealership.com"
    }
  }
}
```

### GET /auth/profile

Get authenticated tenant profile.

**Auth:** JWT or API Key

### PATCH /auth/profile

Update tenant name.

**Auth:** JWT or API Key
```json
{
  "name": "New Dealership Name"
}
```

### PATCH /auth/password

Change password.

**Auth:** JWT or API Key
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### POST /auth/regenerate-key

Regenerate API key.

**Auth:** JWT or API Key

---

## Evaluation

### POST /evaluate

Evaluate an application against all active financing programs.

**Auth:** JWT or API Key

```json
{
  "application_id": 123
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bestOffer": {
      "programId": 1,
      "programName": "Car Financing - Bank Misr",
      "status": "APPROVED",
      "installment": 8500,
      "totalPayment": 612000,
      "interestRate": 0.145,
      "months": 72,
      "dti": 28.5,
      "riskScore": 15,
      "riskLevel": "LOW",
      "affordabilityScore": 85,
      "approvalProbability": 92,
      "reasons": [
        { "type": "RULE", "message": "Salary meets minimum requirement", "impact": "LOW" },
        { "type": "RULE", "message": "Vehicle age within allowed range", "impact": "LOW" }
      ]
    },
    "offers": [
      { "...": "..." }
    ]
  }
}
```

---

## Optimization

### POST /optimize

Get suggestions to improve approval probability.

**Auth:** JWT or API Key

```json
{
  "price": 500000,
  "salary": 25000,
  "current_liabilities": 5000,
  "requested_down_payment": 50000,
  "requested_months": 48,
  "age": 35,
  "job_type": "private",
  "car_age": 3,
  "owns_property": false,
  "owns_car": false,
  "salary_transfer": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "current": {
      "bestOffer": { "...": "..." },
      "approvalProbability": 68,
      "offersCount": 5,
      "approvedCount": 2
    },
    "suggestions": [
      {
        "type": "DOWN_PAYMENT",
        "label": "Increase down payment to 30% of vehicle price",
        "currentValue": "50,000 EGP",
        "suggestedValue": "150,000 EGP",
        "currentApproval": 68,
        "projectedApproval": 91,
        "impact": "HIGH"
      },
      {
        "type": "DURATION",
        "label": "Extend financing duration to 60 months",
        "currentValue": "48 months",
        "suggestedValue": "60 months",
        "currentApproval": 68,
        "projectedApproval": 78,
        "impact": "MEDIUM"
      }
    ],
    "parameters": {
      "price": 500000,
      "downPayment": 50000,
      "downPaymentPercent": 10,
      "duration": 48,
      "salary": 25000,
      "dti": 20
    }
  }
}
```

---

## Admin CRUD

All admin endpoints follow the same pattern. All require JWT or API Key auth.

### Banks

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/banks | List all banks |
| POST | /admin/banks | Create bank |
| PATCH | /admin/banks/:id | Update bank |
| DELETE | /admin/banks/:id | Delete bank |

### Programs

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/programs | List all programs |
| POST | /admin/programs | Create program |
| PATCH | /admin/programs/:id | Update program |
| DELETE | /admin/programs/:id | Delete program |

### Rules

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/rules/:programId | List rules for program |
| POST | /admin/rules | Create rule |
| PATCH | /admin/rules/:id | Update rule |
| DELETE | /admin/rules/:id | Delete rule |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/customers | List customers |
| GET | /admin/customers/:id | Get customer |
| POST | /admin/customers | Create customer |
| PATCH | /admin/customers/:id | Update customer |
| DELETE | /admin/customers/:id | Delete customer |

### Vehicles

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/vehicles | List vehicles |
| GET | /admin/vehicles/:id | Get vehicle |
| POST | /admin/vehicles | Create vehicle |
| PATCH | /admin/vehicles/:id | Update vehicle |
| DELETE | /admin/vehicles/:id | Delete vehicle |

### Applications

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/applications | List applications |
| POST | /admin/applications | Create application |
| PATCH | /admin/applications/:id/status | Update application status |

---

## Public Endpoints

### GET /public/vehicles/:code

List available vehicles for a dealer (by API key code).

### POST /public/apply

Submit a financing application from a public form.

```json
{
  "customer": { "name": "...", "national_id": "...", "phone": "...", "salary": 25000, "job_type": "private" },
  "vehicle": { "brand": "Toyota", "model": "Corolla", "manufacturing_year": 2020, "condition": "used", "price": 500000 },
  "application": { "requested_down_payment": 50000, "requested_months": 48, "payment_method": "salary_transfer" }
}
```

---

## Health Check

### GET /health

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## Response Format

### Success (with data):
```json
{
  "success": true,
  "data": { ... }
}
```

### Success (no data):
```json
{
  "success": true
}
```

### Error:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

HTTP status codes: 200 (success), 201 (created), 400 (validation), 401 (unauthorized), 404 (not found), 429 (rate limited), 500 (server error).

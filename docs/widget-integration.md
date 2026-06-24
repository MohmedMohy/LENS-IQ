# Widget Integration Guide

## Overview

The Lens IQ widget is an embeddable iframe that displays financing options directly inside your CRM. No code changes to your backend — just add an iframe.

Integration takes **less than one hour**.

---

## Quick Start

```html
<iframe
  src="https://widget.lensiq.app?customerId=123&apiKey=YOUR_API_KEY"
  width="100%"
  height="500"
  style="border: none; border-radius: 8px;"
  title="Lens IQ Financing"
></iframe>
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `customerId` | Yes | Application ID from Lens IQ |
| `apiKey` | Yes | Dealer API key from Lens IQ admin panel |

---

## Step-by-Step

### 1. Get Your API Key

1. Log in to the Lens IQ admin dashboard
2. Go to **Profile** → **Regenerate API Key**
3. Copy your API key

### 2. Create the Application

Before embedding, create an application via API:

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "application_id": 123
  }'
```

### 3. Embed the Widget

Add the iframe to your CRM's customer detail page:

```html
<iframe
  src="https://widget.lensiq.app?customerId=APPLICATION_ID&apiKey=API_KEY"
  width="100%"
  height="500"
  style="border: none;"
  title="Lens IQ Financing"
></iframe>
```

### 4. Style the Widget

The widget auto-sizes its content. You can control the iframe dimensions:

```css
.lens-iq-widget {
  width: 100%;
  max-width: 420px;
  height: 480px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

---

## API-Based Integration

For deeper integration, use the REST API directly:

```javascript
// Example: Fetch evaluation results
const response = await fetch("http://localhost:3000/evaluate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_API_KEY",
  },
  body: JSON.stringify({ application_id: 123 }),
});

const result = await response.json();
// result.data.offers — array of financing offers
// result.data.bestOffer — top recommended offer
```

---

## Authentication Methods

### API Key (Recommended for Widget)
Pass via `x-api-key` header or `apiKey` query parameter in the iframe URL.

### JWT Token
For server-to-server integration, use JWT tokens obtained via `/auth/login`.

---

## Rate Limits

| Tier | Requests/Minute |
|------|-----------------|
| Default | 100 |
| Whitelisted (localhost) | Unlimited |

---

## Security

- All communication is over HTTPS (production)
- API keys are hashed at rest (bcrypt)
- JWT tokens expire in 7 days
- CORS whitelist enforced at the API level
- Rate limiting prevents abuse (100 req/min)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Widget shows "Missing customerId" | Add `customerId` parameter to iframe URL |
| Widget shows "Unauthorized" | Check your API key is correct and active |
| Widget not rendering | Ensure your CRM allows iframes (check Content-Security-Policy) |
| CORS errors | Add your CRM domain to the API's `CORS_ORIGINS` env var |

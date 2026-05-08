# Texcelerators Backend – Example API Usage

## 1) Setup (local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an env file:
   - Copy `.env.example` → `.env`
   - Set `MONGODB_URI` and `JWT_SECRET`
3. Start MongoDB (locally or Atlas).
4. Start the API:
   ```bash
   npm run dev
   ```

Base URL: `http://localhost:5000`

---

## 2) Admin registers first (one-time)

### POST `/auth/register-admin`
```bash
curl -X POST http://localhost:5000/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@texcelerators.com",
    "password": "admin123"
  }'
```

---

## 3) Login (admin or member)

### POST `/auth/login`
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@texcelerators.com",
    "password": "admin123",
    "role": "admin"
  }'
```

Response includes a JWT:
- `token`
- `user` (includes `mustChangePassword`)

---

## 4) Admin creates members (members cannot self-register)

### POST `/members/add`
```bash
curl -X POST http://localhost:5000/members/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Aarav",
    "email": "aarav@texcelerators.com"
  }'
```

The API returns a `tempPassword`. On first login the member is forced to change it.

---

## 5) Member first login → change password

### POST `/auth/login`
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aarav@texcelerators.com",
    "password": "<TEMP_PASSWORD>",
    "role": "member"
  }'
```

### POST `/auth/change-password`
```bash
curl -X POST http://localhost:5000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -d '{
    "oldPassword": "<TEMP_PASSWORD>",
    "newPassword": "newStrongPass1"
  }'
```

---

## 6) Member submits payment (with receipt)

### POST `/payments/add` (multipart/form-data)
```bash
curl -X POST http://localhost:5000/payments/add \
  -H "Authorization: Bearer <MEMBER_TOKEN>" \
  -F "amount=500" \
  -F "notes=April fee" \
  -F "receipt=@./sample-receipt.jpg"
```

Uploaded receipts are accessible at:
- `http://localhost:5000<receiptPath>`

---

## 7) Admin verifies / rejects payments

### POST `/payments/verify`
Approve:
```bash
curl -X POST http://localhost:5000/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "action": "approve"
  }'
```

Reject:
```bash
curl -X POST http://localhost:5000/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "action": "reject",
    "rejectedReason": "Receipt is unclear"
  }'
```

---

## 8) Admin adds a manual payment (auto-approved)

### POST `/payments/add`
```bash
curl -X POST http://localhost:5000/payments/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "memberId": "<MEMBER_ID>",
    "amount": 500,
    "isManual": true,
    "notes": "Paid in cash"
  }'
```

---

## 9) Admin adds expenses

### POST `/expenses/add`
```bash
curl -X POST http://localhost:5000/expenses/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "title": "Poster Printing",
    "amount": 300,
    "category": "Marketing",
    "date": "2026-05-01",
    "notes": "Event posters"
  }'
```

---

## 10) Dashboard data (admin or member)

### GET `/dashboard/data`
```bash
curl http://localhost:5000/dashboard/data \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Notes

- If a user has `mustChangePassword=true`, most routes will return:
  - `403` + `{ code: "PASSWORD_CHANGE_REQUIRED" }`
  until `/auth/change-password` is completed.
- Razorpay integration later: the `Payment` model already has placeholder Razorpay fields.

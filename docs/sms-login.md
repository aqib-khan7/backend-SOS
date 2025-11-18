SMS Phone Login
================

Environment variables
---------------------
- `DATABASE_URL`: Prisma connection string.
- `JWT_SECRET`: secret used to sign login tokens (`JWT_EXPIRES_IN` optional).
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID.
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token.
- `TWILIO_VERIFY_SERVICE_SID`: Your Twilio Verify Service SID (e.g., `VAd26228232170e9d635c91c89a23fdb03`).
- `ALLOWED_ORIGINS`: comma-separated list for CORS (leave empty to allow all in dev).

Workflow
--------
1. `POST /api/v1/user/auth/login/request-otp`
   - Body: `{ "phone": "<E.164 phone>" }` (e.g., `+1234567890`)
   - Uses Twilio Verify API to send OTP via SMS. Twilio handles OTP generation and expiration.
   - Returns: `{ "message": "OTP sent successfully...", "sid": "..." }`

2. `POST /api/v1/user/auth/login/verify-otp`
   - Body: `{ "phone": "<E.164 phone>", "otp": "123456" }`
   - Verifies OTP using Twilio Verify API.
   - Auto-registers user if they don't exist.
   - Returns JWT token and user info on success.

Notes
-----
- Uses Twilio Verify API - Twilio handles OTP generation, expiration, and verification.
- Users are auto-registered on first successful login.
- Phone numbers must be in E.164 format (e.g., `+1234567890`).
- OTPs expire after 10 minutes (Twilio default) and can only be used once.


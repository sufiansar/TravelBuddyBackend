# TravelBuddyBackend

A concise, practical backend for the TravelBuddy application.

This README documents the repository structure, setup, configuration, development workflows, key modules and endpoints, integration notes (Stripe, Cloudinary), debugging tips, and deployment guidance. It is written to be a developer-friendly companion to help new contributors and maintainers get productive quickly.

---

Table of Contents

1. Project Summary
2. Quick Start
3. Environment Variables
4. Project Structure
5. Key Modules and What They Do
6. Database and Prisma
7. Authentication and Authorization
8. File Uploads (Cloudinary + Multer)
9. Payments & Stripe Integration
10. Webhooks and Idempotency
11. APIs and Example Requests
12. Validation and Error Handling
13. Security Hardening
14. Testing and Postman
15. Running Locally
16. Deployment Guidance
17. Common Issues & Troubleshooting
18. Contribution Guide
19. Changelog and Versioning
20. Credits & License

---

1. Project Summary

- Purpose: Backend for TravelBuddy, a travel/trip matching and meetup platform.
- Stack: Node.js, TypeScript, Express, Prisma (Postgres), Stripe, Cloudinary.
- Responsibilities: user auth, travel plans, matches, meetups, posts (social), reviews, payments/subscriptions, admin tools, explore/search APIs, and contact/email handling.
- Goals: Simple, testable, production-ready APIs with reasonable defaults and pragmatic security.

2. Quick Start

Prerequisites:

- Node.js (recommended 18+)
- bun / npm / yarn (dev uses bun and npm scripts — adapt commands to your environment)
- PostgreSQL database
- [Stripe account] for payments (test keys ok)
- Cloudinary account for uploads (optional)

Typical quick-start commands (assuming npm):

```bash
# install deps
npm install

# generate prisma client
npx prisma generate --schema ./prisma

# run migrations (development)
npx prisma migrate dev --schema ./prisma --name init

# run dev server
npm run dev
```

Note: Project's package.json includes `prisma:generate` and `prisma:migrate` scripts that reference `--schema ./prisma` because the repo stores multiple `.prisma` files under `prisma/` and a small `prisma.config.ts` loads them.

3. Environment Variables

Create a `.env` at repository root with keys similar to below. Exact names are used in the `src/config/db.config.ts` and elsewhere.

Required / important env vars:

- DATABASE_URL
- PORT
- NODE_ENV
- ACCESS/REFRESH token secrets and expirations:
  - ACCESSTOKEN_SECRET
  - ACCESSTOKEN_EXPIRESIN
  - REFRESHTOKEN_SECRET
  - REFRESHTOKEN_EXPIRESIN
- SMTP settings (used for sendMail):
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM
- STRIPE keys:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
- CLOUDINARY (optional):
  - CLOUDINARY_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
- CLIENT_URL (frontend app URL for success/cancel redirects)
- LOGO_URL (optional for invoice template)
- PRICE_MONTHLY_CENTS, PRICE_YEARLY_CENTS - numeric values in cents
- SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD

Example `.env` snippet (replace placeholders):

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:pgadmin@localhost:5432/travelbuddy?schema=public
ACCESSTOKEN_SECRET=your_access_secret
ACCESSTOKEN_EXPIRESIN=1h
REFRESHTOKEN_SECRET=your_refresh_secret
REFRESHTOKEN_EXPIRESIN=7d
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=example
SMTP_PASS=examplepass
SMTP_FROM=hello@travelbuddy.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:3000
PRICE_MONTHLY_CENTS=5000
PRICE_YEARLY_CENTS=50000
LOGO_URL=https://example.com/logo.png
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=supersecure
```

Keep `.env` private. Add `.env` to `.gitignore` if not already present.

4. Project Structure

Top-level files and folders (high-level view):

- `src/`

  - `app.ts` - express app config (middlewares, routes)
  - `server.ts` - bootstrap and start server
  - `config/` - db, cloudinary, multer, prisma helper
  - `modules/` - feature folders (auth, user, travelPlan, review, post, payment, explore, admin, contact, etc.)
  - `routes/route.ts` - registers module routes
  - `utils/` - helpers (jwt, sendMail, paginationHelper, pick, userToken, templates)
  - `middleware/` - auth, validation, global error handler
  - `generated/prisma` - prisma client output (auto-generated)

- `prisma/` - prisma models split into files (user.prisma, payment.prisma, subscription.prisma, travlePlan.prisma, stripeEvent.prisma, etc.) plus migrations

Important module highlights:

- `modules/auth/` - login, refresh tokens, profile, set cookie helper
- `modules/user/` - user controller/service, profile updates and image upload
- `modules/travelPlan/` - travel plan CRUD, search, request flow
- `modules/review/` - create reviews, list, aggregate average ratings
- `modules/post/` - social posts, reactions, saves, shares, comments
- `modules/payment/` - Stripe session creation, webhook handler, idempotency, invoice email
- `modules/admin/` - admin APIs for users, payments, subscriptions and stats
- `modules/explore/` - search / explore endpoints
- `modules/contact/` - contact form email via `sendMail`

5. Key Modules and What They Do

Auth

- Handles login, refresh tokens, and get profile.
- Uses access and refresh tokens, stored in cookies for convenience.
- JWT helpers: `src/utils/jwt.ts` (generate & verify)

User

- User registration/updates
- Profile image upload via `multer` + Cloudinary

Travel Plans

- CRUD travel plans
- Search and filtering
- Request/approve flow for joining plans

Travel Matching

- Match travelers to plans based on criteria

Meetups

- Meetup creation, membership, and management

Posts

- Create posts, like/dislike (reactions), save, share
- Comments support
- Counts for comments / reactions / saves / shares are surfaced in responses

Reviews

- Create and list reviews
- Validation ensures reviews only after travel plan end
- Aggregate average rating for a plan

Payments

- Stripe checkout session creation and verification
- Webhook handling with database-backed idempotency (`StripeEvent` model)
- Store Stripe IDs on Payment and Subscription models
- On successful payment, generate and email invoice (EJS template)

Admin

- Admin endpoints for listing users, payments, subscriptions, travel plans
- Filtering, pagination, and role checks

Explore

- Search engine to find plans and travellers

Contact

- `/contact` endpoint sends contact email using SMTP settings

6. Database and Prisma

- Prisma is used as the ORM with PostgreSQL.
- The `prisma/` directory contains model files which are loaded by `prisma.config.ts`.
- Common models: User, TravelPlan, TravelMatch, Subscription, Payment, Review, Post, Comment, Reaction, StripeEvent.

Migrations and workflow:

```bash
# generate client
npx prisma generate --schema ./prisma

# create/apply a migration (development)
npx prisma migrate dev --schema ./prisma --name descriptive_name

# to create a migration without applying
npx prisma migrate diff # or use migrate create depending on version
```

Notes:

- We store Stripe and session IDs in `Payment` to support webhook idempotency and reconciliations.
- A `StripeEvent` model records processed `event.id` values; webhook checks this table before processing events to avoid duplicates.

7. Authentication and Authorization

- JWT-based auth (access + refresh tokens).
- Tokens are signed with secrets in `.env`.
- `src/middleware/checkAuth.ts` reads the cookie `accessToken` and validates it.
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN` (enforced in admin routes and related service functions).

Cookie settings and security:

- Cookies set by `setCookie.ts` include secure flags depending on NODE_ENV.
- If running locally, ensure client and server agree on domain and port.

8. File Uploads (Cloudinary + Multer)

- `src/config/multer.congig.ts` includes the multer config used to accept files.
- `src/config/cloudinary.config.ts` contains Cloudinary initialization and helpers.
- User profile image upload endpoint uses multer and persists the image URL to the user model.

Important: set Cloudinary env vars for production usage.

9. Payments & Stripe Integration

- Stripe Checkout sessions are created in `PaymentService.createCheckoutSession`.
- `verifyAndProcessSession(sessionId)` retrieves the session and processes it if `payment_status === 'paid'`.
- `handleCheckoutSession` contains the logic for creating or upserting subscriptions and payments in the DB.
- Payment records include `stripePaymentIntentId`, `stripeSessionId`, and `transactionId` for audit.

10. Webhooks and Idempotency

- `src/modules/payment/payment.webhook.ts` verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`.
- Instead of an in-memory `Set`, webhook processing stores processed events in the `StripeEvent` model.
- This ensures idempotency across restarts and multiple webhook deliveries.

Webhook handler flow:

1. Verify signature
2. Check DB for `event.id` in `StripeEvent` table; if present, skip
3. Process the event (checkout.session.completed, payment_intent.failed, invoice.payment_failed, etc.)
4. Record `StripeEvent` entry after success

5. APIs and Example Requests

Base URL: `http://localhost:5000/api` (if `app.ts` mounts `/api` prefix — check your routes registration)

Authentication (example):

- POST /auth/login

  - payload: { email, password }
  - sets `accessToken` cookie and returns minimal profile data

- GET /auth/me
  - requires `accessToken` cookie

Travel Plans:

- GET /travelPlans

  - query params: `page`, `limit`, `sortBy`, `sortOrder`, `searchTerm`, `minBudget`, `maxBudget`, `destination` etc.

- POST /travelPlans
  - body: travel plan fields

Reviews:

- POST /reviews
  - body: { rating, comment, receiverId, travelPlanId }
  - note: `travelPlanId` review allowed only after plan `endDate`

Payments:

- POST /payments/checkout-session
  - body: { userId, plan }
  - returns `session.id` and redirect URL. After payment, frontend should call `/payments/verify?session_id=...` or rely on webhooks.

Contact:

- POST /contact
  - body: { name, email, subject, message }
  - will send an email to configured SMTP address

Admin (protected):

- GET /admin/users

  - query filters: role, userStatus, verifiedBadge, searchTerm

- GET /admin/payments
  - query filters: status, userId

Explore:

- GET /explore/plans
  - multi-criteria search and filters

12. Validation and Error Handling

- `validateRequest.ts` uses schema validators (zod or custom) to validate request payloads.
- Global error handler `middleware/globalErrorHandler.ts` formats errors consistently.
- The project uses `catchAsync` utility to wrap async route handlers and forward errors to the global handler.

Common error handling patterns:

- Return 4xx for client errors (bad payload, missing token)
- Return 5xx for server errors and log details (do not leak secrets)

13. Security Hardening

Implemented measures:

- `helmet` (headers) — currently optional in `app.ts`, can be enabled
- `express-rate-limit` on `/api` to reduce brute-force attacks
- `express-mongo-sanitize` to sanitize payloads (if using mongo-like queries — included as defense)
- Cookie flags: secure, httpOnly, sameSite depending on environment
- Input validation for endpoints

Recommended next steps for production:

- Enforce `helmet()` and rate limit in all environments
- Use HTTPS with strong ciphers
- Deploy behind a reverse proxy (NGINX) and ensure proper header forwarding

14. Testing and Postman

- There is no unit test suite in the repo by default; add tests using Jest or Vitest for critical paths (auth, payment logic, webhook processing).
- Build a Postman collection to exercise endpoints (login, create plan, create session, simulate webhook, contact form) and store it with the repo or export it to the team workspace.

Example Postman flow for payments (testing):

1. Login as test user -> capture cookies
2. POST to `/payments/checkout-session` -> get `session.id`
3. Simulate Stripe session completion (for local dev you can call `verifyAndProcessSession` or use the Stripe CLI to send a `checkout.session.completed` webhook)
4. Confirm DB state (Subscription and Payment created) and check for invoice email

5. Running Locally

- Ensure PostgreSQL is running and `DATABASE_URL` points to the DB
- Install dependencies, generate Prisma client, run migrations
- Start dev server using `npm run dev` or `bun dev` (depending on your toolchain)

Useful commands:

```bash
# generate prisma client
npx prisma generate --schema ./prisma

# apply migrations (development)
npx prisma migrate dev --schema ./prisma

# dev server
npm run dev
# or
bun dev
```

If the server fails to start, check logs printed in the console. The app includes helpful logs for operations such as Stripe session handling and migrations.

16. Deployment Guidance

- Use environment-specific `.env` with secrets stored in a secrets manager (AWS Secrets Manager, GitHub secrets, etc.)
- Database migrations: in CI/CD run `npx prisma migrate deploy` (not `dev`) to apply migrations in production
- Build step: `npm run build` (TypeScript compile)
- Run `node dist/server.js` or use a process manager (PM2) / containerization (Docker)

Docker example snippet (very brief):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node","dist/server.js"]
```

17. Common Issues & Troubleshooting

This section records common runtime errors and steps to fix them.

A. "jwt must be provided" or token errors

- Cause: `accessToken` cookie missing or not passed.
- Fix: Ensure the client stores cookie from login response and sends it on subsequent requests. Verify cookie flags (httpOnly, secure) and sameSite when testing from a different host/port.
- Server-side: `checkAuth` middleware reads `req.cookies.accessToken` — make sure `cookie-parser` is registered in `app.ts`.

B. Prisma validation errors (unknown/undefined field)

- Cause: Query building with `undefined` filter values (e.g., `role: 'undefined'` or `equals: '5200'` where field expects Int).
- Fix: Use the `pick` utility and validate/convert query strings into correct types (helpers in `utils/paginationHelper` and recent patches convert numeric filters to Number).

C. Stripe webhook idempotency

- Problem: duplicate webhook handling.
- Fix: The repo includes a `StripeEvent` model and webhook logic checks the DB for `event.id` before processing; ensure migrations are applied and `StripeEvent` table exists.

D. Sending emails fails

- Check SMTP settings in `.env` and network access to SMTP host
- Log includes `email sending error` messages — view full stack traces to see SMTP responses

E. TypeScript and build issues

- Use matching TypeScript version and `esModuleInterop` flags if library typings complain about default imports (see `tsconfig.json`)

18. Contribution Guide

- Fork the repo or create a feature branch `feature/your-feature` from `main`.
- Make small, testable commits with clear messages.
- Keep pull requests focused and include the motivation and summary of changes.
- Run `npx prisma generate` if you modify prisma models, and create a migration with `npx prisma migrate dev --name your_change`.

Code style:

- Use TypeScript strictness where possible
- Keep controllers thin; put business logic in services
- Use `catchAsync` for route handlers to reduce boilerplate

19. Changelog and Versioning

- Keep a `CHANGELOG.md` to record release notes (not included by default).
- Use semantic versioning (SemVer) in releases.

20. Credits & License

- Author: Your team (change as needed)
- This repository is provided as-is. Add a license file (MIT/Apache2) as appropriate.

---

Appendix: Quick Reference Commands

- Install dependencies: `npm ci` or `bun install`
- Generate prisma client: `npx prisma generate --schema ./prisma`
- Create dev migration: `npx prisma migrate dev --schema ./prisma --name <desc>`
- Apply migrations in production: `npx prisma migrate deploy --schema ./prisma`
- Start dev server: `npm run dev` or `bun dev`
- Build for production: `npm run build`

Appendix: Where to look for things

- `src/modules/*` - feature implementation
- `src/config/*` - service and infra config (db, cloudinary)
- `src/utils/*` - helpers (jwt, sendMail, paginationHelper, pick)
- `prisma/` - database model files and migrations
- `src/utils/templates/` - EJS templates used for emails (invoice/contact)
- `src/modules/payment/payment.webhook.ts` - webhook signature handling + idempotency

---

If you'd like, I can:

- produce a smaller printable quickstart docs (1–2 pages)
- generate a Postman collection from current endpoints
- add a `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`

Thanks — tell me which next task you'd like me to pick up from the TODO list.

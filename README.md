# VectorPay

A digital wallet where you send money to a phone number, add funds, and see where your money went.
Full-stack: React + Vite on the front, Express + MongoDB behind it.

> **Portfolio project.** Balances are simulated and no real money moves.

<!-- Add a screenshot or short GIF here: ![VectorPay dashboard](docs/dashboard.png) -->

## Features

- **Send by phone number** with a live name check, so you see who you're paying before you confirm
- **Add money** (simulated bank top-up) and a **review step** before every transfer
- **Spending calendar**: each day shaded by how much you sent, with month navigation
- **Activity feed** grouped by day, filterable (sent / received / added), with cursor pagination
- **Password reset** by emailed 6-digit code
- **Admin view** with platform totals and searchable accounts
- Accessible by default: keyboard navigable, visible focus, labelled controls, reduced-motion support

## Quick start

### With Docker (everything in one command)

```bash
cp .env.example .env
# put a random value in JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose up --build
# optional: load demo users and 75 days of activity
docker compose exec -e ADMIN_PASSWORD='ChooseAPassword1' backend npm run seed -- --demo
```

Open <http://localhost:8080>. Password-reset codes are printed in `docker compose logs backend`.

### Without Docker

Requires Node 20+ and a local MongoDB.

```bash
# API
cd backend
cp .env.example .env        # set JWT_SECRET
npm install
npm run seed -- --demo      # optional demo data
npm run dev                 # http://localhost:5000

# Web app (second terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to the API)
```

### Demo accounts (after `npm run seed -- --demo`)

| Role  | Phone        | Password       |
| ----- | ------------ | -------------- |
| User  | `9876543210` | `Demo@1234`    |
| User  | `9876543211` | `Demo@1234`    |
| Admin | `9000000000` | `Admin@12345` (dev default; set `ADMIN_PASSWORD` to change) |

## How it works

### Money is handled carefully

- **Integer paise everywhere.** Amounts are stored and sent as integers (₹12.50 = `1250`), so floating-point
  rounding errors can't creep in. The UI parses typed amounts with string maths, not `parseFloat`.
- **Balances can't go negative, even under concurrency.** A debit is one conditional update
  (`balance >= amount`), so two requests racing for the same money can't both succeed.
  `test/wallet.test.js` fires ten parallel transfers at a balance that affords three and asserts exactly three win.
- **Ledger first.** A transfer writes a `pending` transaction, moves the money, then marks it `completed`.
  If crediting the recipient fails, the sender is refunded and the row becomes `failed`. A crash mid-way
  leaves a visible `pending` row to reconcile, rather than money silently missing.

### Security

- Sessions are a JWT in an **httpOnly, SameSite=Lax cookie**, not `localStorage`, so page scripts can't read it.
- Passwords are hashed with bcrypt (cost 12). Changing a password invalidates every existing session.
- Reset codes are generated with `crypto.randomInt`, stored **hashed**, expire after 10 minutes, are single-use,
  and lock after 5 wrong guesses. The "forgot password" response is identical whether or not the email exists.
- Sign-in gives one generic error for "unknown phone" and "wrong password" to prevent account enumeration.
- Recipient lookup requires sign-in, is rate-limited, and returns only a name.
- `helmet`, request-size limits, per-route rate limits, and schema validation (zod) on every input.

### API

All routes are under `/api`. Amounts are integer paise.

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | | Create account, sign in, sign out |
| GET  | `/auth/me` | user | Current user |
| POST | `/auth/forgot`, `/auth/verify-otp`, `/auth/reset` | | Password reset (email → code → new password) |
| GET  | `/wallet` | user | Balance |
| POST | `/wallet/topup` | user | `{ amount }` |
| POST | `/wallet/transfer` | user | `{ toPhone, amount, note? }` |
| GET  | `/wallet/transactions` | user | `?type=all\|sent\|received\|topup&limit&before` (cursor) |
| GET  | `/wallet/spend/daily`, `/wallet/summary` | user | `?start&end&tz` for the calendar and monthly totals |
| GET  | `/users/lookup` | user | `?phone=` → `{ name }` |
| GET  | `/admin/stats`, `/admin/users` | admin | Platform totals, searchable accounts |
| GET  | `/health` | | Liveness + database status |

## Project structure

```
backend/src
  app.js · server.js         Express app and process entry
  config/                    env validation, database connection
  routes/ → controllers/ → services/walletService.js   (money logic lives in the service)
  models/                    User, Wallet, Transaction, PasswordReset
  middleware/                auth, validation, rate limits, error handler
  validators/schemas.js      zod schemas for every request
  scripts/seed.js            admin + deterministic demo data
backend/test                 API integration tests + unit tests

frontend/src
  pages/                     Landing, Login, Register, ForgotPassword, Dashboard, Admin
  components/                shared UI; components/dashboard for wallet widgets
  context/                   AuthContext, ToastContext
  api/                       axios client and endpoint helpers
  utils/                     money, date, phone helpers (unit-tested)
  styles/                    design tokens + per-area stylesheets (no UI framework)
```

## Tests

```bash
cd backend  && npm test    # API integration tests (in-memory MongoDB) + unit tests
cd frontend && npm test    # money, date and phone helpers
```

CI runs both suites and a production build on every push (`.github/workflows/ci.yml`).

## Design notes

Brand colour is a deep pine green with a single jade accent; error red is reserved for errors only.
Headings use Bricolage Grotesque and body text uses Figtree. The landing page and dashboard share one
motif, a line travelling from one point to another, echoing the name. Layouts lean on hairline dividers and
whitespace rather than boxing everything in cards.

## Known limitations and next steps

- Transfers use conditional updates plus a ledger, not multi-document transactions. Moving to a MongoDB
  replica set would allow real transactions, and a small job could sweep stale `pending` rows.
- Top-ups are simulated; a real payment provider would be integrated behind `walletService.topUp`.
- Single currency (INR). Phone numbers are validated as 10 digits.
- Add end-to-end browser tests (Playwright) and commit `package-lock.json` files so CI can use `npm ci`.

## License

MIT

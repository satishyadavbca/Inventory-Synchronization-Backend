# Sartho Billing / Inventory API

A NestJS + Prisma + PostgreSQL backend providing user registration, cookie-based
JWT authentication, and inventory management.

---

## Features & Security Architecture

* **Password hashing**: Argon2id with configured memory and time cost factors.
* **Token delivery**: JWT access (15m) and refresh (7d) tokens are issued as
  **HttpOnly**, `SameSite=Strict` cookies (`Secure` in production).
* **Rate limiting**: NestJS Throttler on the login endpoint, plus per-account
  failed-login lockout. *(Storage is in-memory today — see "Current limitations".)*
* **Input validation**: Global `ValidationPipe` with `whitelist` and
  `forbidNonWhitelisted`, backed by `class-validator` DTOs.
* **HTTP hardening**: Helmet security headers and a strictly scoped CORS policy.
* **Structured logging**: Pino (`nestjs-pino`) with automatic redaction of
  passwords, cookies, and tokens.

---

## Project Structure

```
src/
  auth/         Authentication module (login/logout, JWT issuance, lockout)
  users/        User registration module
  inventory/    Inventory products module (CRUD)
  prisma/       Global PrismaModule + PrismaService
  app.module.ts Root module wiring
  main.ts       Bootstrap: env validation, Helmet, CORS, cookies, ValidationPipe
prisma/
  schema.prisma Data models: User, Product, Category
  migrations/   SQL migration history
```

---

## Prerequisites

* **Docker Desktop** — the only requirement for the containerized workflow below.

For running **without** Docker (directly on the host):

* Node.js **20+**
* PostgreSQL **15+**

> Redis is **not** required. See "Current limitations".

---

## Configuration

All configuration is supplied through environment variables. Copy the example
file and fill in real values:

```bash
cp .env.example .env
```

Generate strong JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Required variables (the server refuses to start if any are missing):
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`.

> **Never commit `.env`.** It is git-ignored. Only `.env.example` (placeholders)
> is tracked.

---

## Running with Docker (recommended)

### Production-style stack

Builds the app, starts PostgreSQL, applies database migrations automatically,
then launches the API:

```bash
docker compose up --build
```

The API is available at `http://localhost:3000`. Data persists in the `pgdata`
volume. Stop with `docker compose down` (add `-v` to also drop the database
volume).

### Development stack (hot reload)

Mounts your local `./src` and `./prisma` and runs `nest start --watch`, so code
changes reload automatically:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Useful commands while the dev stack is running:

```bash
# Create a new migration after editing schema.prisma
docker compose exec api npx prisma migrate dev --name <change_name>

# Regenerate the Prisma client after a schema change
docker compose exec api npx prisma generate
```

---

## Running without Docker

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Ensure PostgreSQL is running and `DATABASE_URL` in `.env` points to it.
3. Apply migrations and generate the client:
   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:generate
   ```
4. Start the server:
   ```bash
   npm run start:dev     # watch mode
   # or
   npm run build && npm run start:prod
   ```

> **Note:** the application reads configuration from the process environment and
> does **not** auto-load `.env` at runtime. Prisma CLI commands read `.env`
> automatically, but for the Nest server either export the variables into your
> shell, or start it with Node's built-in loader, e.g.
> `node --env-file=.env dist/main.js`. (The Docker workflow injects these
> variables for you, so this only applies to host-native runs.)

---

## npm Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Start in watch mode (`nest start --watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run the compiled server (`node dist/main.js`) |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate:dev` | Create/apply a migration in development |
| `npm run prisma:migrate:deploy` | Apply pending migrations (production) |

---

## API Endpoints

### Authentication & Users
* `POST /users` — Register a new user (`{ email, password }`).
* `POST /auth/login` — Authenticate; sets HttpOnly access/refresh cookies.
* `POST /auth/logout` — Clear session cookies.

### Inventory
* `GET /inventory/products` — List all products.
* `GET /inventory/products/:id` — Fetch one product.
* `POST /inventory/products` — Create a product (`name`, `sku`, `quantity`, `price`).

---

## Current limitations / roadmap

* **Rate-limiter storage is in-memory.** The throttler is not yet backed by
  Redis, so limits are per-instance and reset on restart. Redis-backed
  distributed rate limiting is a planned enhancement; the previous
  `nestjs-throttler-storage-redis` dependency was removed because it was unused
  and conflicted with the project's `reflect-metadata` version.
* **CSRF middleware is disabled.** A `csurf` setup exists in `main.ts` but is
  commented out; enable it once the client sends CSRF tokens.
* **Protected routes are not yet guarded.** Inventory endpoints do not currently
  enforce a JWT guard (a `JwtAuthGuard` is a TODO in the inventory controller).
  Tokens are issued but not yet verified on protected routes.

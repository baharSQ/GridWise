# GridWise - Smart Energy Scheduler API

GridWise is a NestJS + TypeORM backend MVP for household energy management.
It supports:

- JWT authentication
- household management
- device management
- schedule management
- deterministic schedule optimization against a household power limit

All API routes are served under `/api`.

## Project overview

The MVP models a simple ownership chain:

`User -> Household -> Device -> Schedule`

Users can only access resources they own. Ownership checks are enforced in
service/business logic (not only in controllers).

## Architecture

### Modules

- `AuthModule`: registration, login, JWT-protected `/auth/me`
- `HouseholdsModule`: household CRUD subset (create/list/get)
- `DevicesModule`: create/list/update/delete household devices
- `SchedulesModule`: create/list/get/update/delete schedules + optimize endpoint
- `HealthModule`: health check endpoint

### Data layer

- SQL Server via TypeORM
- Versioned migrations in `src/database/migrations`
- `synchronize: false` in runtime and migration data source configuration

## Technology stack

- Node.js
- NestJS 11
- TypeORM 0.3
- SQL Server (`mssql` driver)
- class-validator / class-transformer
- Passport JWT
- Jest + Supertest for unit/e2e tests

## Environment configuration

1. Copy `.env.example` to `.env`.
2. Fill in real values.

Example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_DATABASE=GridWise
DB_USERNAME=gridwise_app
DB_PASSWORD=replace-with-strong-password
JWT_SECRET=replace-with-a-long-random-secret
```

> `.env` is gitignored and must never be committed.

## Install and run

```bash
npm install
```

```bash
# development
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

Health endpoint:

- `GET /api/health`

## Tests

```bash
# unit
npm run test

# e2e
npm run test:e2e
```

## Migrations

```bash
# create empty migration
npm run migration:create

# generate from entity diffs
npm run migration:generate

# apply pending migrations
npm run migration:run

# revert latest migration
npm run migration:revert

# show migration status
npm run migration:show
```

## Authentication overview

- `POST /api/auth/register`
- `POST /api/auth/login` -> returns `accessToken`
- `GET /api/auth/me` (requires `Authorization: Bearer <token>`)

All households/devices/schedules endpoints require JWT auth.

## API overview

### Households

- `POST /api/households`
- `GET /api/households`
- `GET /api/households/:id`

### Devices

- `POST /api/households/:id/devices`
- `GET /api/households/:id/devices`
- `PATCH /api/devices/:id`
- `DELETE /api/devices/:id`

### Schedules

- `POST /api/households/:id/schedules`
- `GET /api/households/:id/schedules`
- `GET /api/schedules/:id`
- `PATCH /api/schedules/:id`
- `DELETE /api/schedules/:id`
- `POST /api/households/:id/schedules/optimize`

## Scheduling optimization algorithm (MVP)

The optimizer is deterministic and intentionally simple:

1. Load `PENDING` and `ACTIVE` schedules for a household.
2. Build timeline segments from schedule start/end boundaries.
3. For each segment, calculate total overlapping requested power.
4. Compare against input `maxPowerKw`:
   - feasible when no segment exceeds the limit
   - conflict entries when a segment exceeds the limit
5. Return a recommended order:
   - flexible devices first (`isFlexible=true`)
   - then non-flexible devices
   - deterministic tie-breaking by start time and schedule id

This keeps behavior deterministic and easy to reason about while modeling realistic
household power-limit checks and conflict detection.

## Notes on schema/cascade behavior

- Household -> Devices uses `ON DELETE CASCADE`.
- Device -> Schedules uses `ON DELETE CASCADE`.
- Schedules also reference `householdId`; on SQL Server this FK uses `NO ACTION`
  to avoid a multiple-cascade-path error while preserving effective cascading
  cleanup through the device path.

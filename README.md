# GridWise - Smart Energy Scheduler

GridWise is a NestJS backend project for scheduling flexible household energy usage in cheaper electricity price windows.

This repository currently contains **Step 2 (foundation only)**:
- NestJS project scaffolding
- SQL Server connection via TypeORM
- environment-based configuration
- migration tooling setup
- global request validation
- health endpoint

## Prerequisites

- Node.js 20+ recommended
- npm
- Local SQL Server instance

## Environment configuration

1. Copy [.env.example](C:/Users/bahareh.sadeghi/Documents/GridWise/.env.example) to `.env`.
2. Fill in your real SQL Server credentials and JWT secret.

Example:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=gridwise_app
DB_PASSWORD=replace-with-strong-password
DB_DATABASE=GridWise
JWT_SECRET=replace-with-a-long-random-secret
```

## Install dependencies

```bash
npm install
```

## Run the app

```bash
# development
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

The app uses a global API prefix, so health is available at:

`GET /api/health`

## Run tests

```bash
# unit
npm run test

# e2e
npm run test:e2e
```

## Migrations (TypeORM)

```bash
# create empty migration
npm run migration:create

# generate migration based on entity changes
npm run migration:generate

# run pending migrations
npm run migration:run

# revert last migration
npm run migration:revert

# show migration status
npm run migration:show
```

### Why migrations instead of synchronize

`synchronize: true` updates schema automatically at runtime, which is risky for production-oriented systems because changes are implicit and hard to review.

Migrations are explicit, versioned, and reviewable. They provide:
- predictable schema evolution
- safer rollout/rollback
- clearer collaboration in teams
- auditable DB change history

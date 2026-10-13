# Vehicle Makes API

NestJS service that ingests vehicle makes and vehicle types from the [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) catalog, stores them in PostgreSQL, caches paginated listings in Redis, and exposes them over GraphQL.

| Surface | Location |
|---|---|
| GraphQL | `POST /graphql` (GraphiQL at the same path in the browser) |
| Ingestion | `POST /makes/sync` |

---

## Local setup

**Prerequisites:** Node.js 24, npm, and Docker with Compose.

### Recommended: full stack with Compose

```bash
cp .env.example .env
npm run compose:dev
```

That command builds `Dockerfile.dev` and starts PostgreSQL 17, Redis 7, and the API. On boot the container:

1. Installs dependencies if `package-lock.json` changed
2. Generates the Prisma client
3. Applies migrations (`prisma migrate deploy`)
4. Starts the compiler and process in watch mode

The API listens on `http://localhost:8080` (or `PORT` from `.env`).

### Host process, Compose for dependencies

```bash
cp .env.example .env
docker compose up postgres redis
npm install
npx prisma migrate deploy
npm run start:dev
```

`npm install` also runs `prisma generate` via the `postinstall` hook.

### Verify

```bash
curl http://localhost:8080
# Hello World!

# Start ingestion (returns immediately; work continues in the background)
curl -X POST http://localhost:8080/makes/sync
```

Then open [http://localhost:8080/graphql](http://localhost:8080/graphql) and run a `getMakes` query (examples below).

---

## Environment variables

Configuration is loaded from the process environment (and from `.env` via `dotenv` — existing variables are never overwritten). Values are validated with Zod on startup in `src/config.ts`. Invalid configuration stops the process.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, or `production`. |
| `PORT` | `8080` | HTTP listen port. |
| `LOG_LEVEL` | see notes | Pino level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`. If unset: `debug` in development, `silent` in test, `info` in production. |
| `DATABASE_URL` | local Postgres in non-prod | PostgreSQL connection string. **Required in production.** Dev/test default: `postgresql://prisma:prisma@localhost:5432/makes?schema=public`. |
| `REDIS_URL` | local Redis in non-prod | Redis connection string. **Required in production.** Dev/test default: `redis://localhost:6379`. |
| `VPIC_BASE_URL` | `https://vpic.nhtsa.dot.gov` | Base URL for the NHTSA vPIC HTTP client. |
| `MAKES_CACHE_TTL_SECONDS` | `300` | Redis TTL (seconds) for cached `getMakes` pages. |

Copy `.env.example` to `.env` for local overrides. Docker Compose injects `DATABASE_URL` and `REDIS_URL` so the API talks to the Compose services by hostname.

---

## Build

```bash
# Generate Prisma client (also runs on npm install)
npm run prisma:generate

# Compile TypeScript to dist/
npm run build

# Run the compiled app (requires DATABASE_URL and REDIS_URL)
npm run start:prod
```

Watch mode (used by Compose):

```bash
npm run start:dev
```

Production image (`Dockerfile`) is a multi-stage Node 24 build: `npm ci`, `prisma generate`, `npm run build`, then a pruned runtime image. The entrypoint runs `prisma migrate deploy` before `node dist/main.js`.

```bash
docker build -t vehicle-makes-api .
```

---

## Data model

Makes and vehicle types come from vPIC. A make has many vehicle types. Deleting a make cascades to its types.

```
┌─────────────────────┐       ┌──────────────────────────┐
│ makes               │       │ vehicle_types            │
├─────────────────────┤       ├──────────────────────────┤
│ makeId     PK  int  │──┐    │ makeId     PK/FK  int    │
│ makeName       text │  └───<│ typeId     PK     int    │
│ createdAt      timestamptz  │ typeName          text   │
│ updatedAt      timestamptz  │ createdAt         timestamptz
└─────────────────────┘       │ updatedAt         timestamptz
                              └──────────────────────────┘
```

Defined in `prisma/schema.prisma`:

| Table | Column | Type | Notes |
|---|---|---|---|
| `makes` | `makeId` | `Int` | Primary key; vPIC `Make_ID`. |
| | `makeName` | `String` | vPIC `Make_Name`. |
| | `createdAt` / `updatedAt` | `DateTime` | Set/updated by Prisma. |
| `vehicle_types` | `(makeId, typeId)` | composite PK | `makeId` references `makes.makeId` (`ON DELETE CASCADE`). |
| | `typeName` | `String` | vPIC `VehicleTypeName`. |
| | `createdAt` / `updatedAt` | `DateTime` | Set/updated by Prisma. |

Domain entities (`src/domain/.../entity`) keep IDs as strings and reject empty `makeId`, `makeName`, `typeId`, or `typeName`. Listings are ordered by `makeName` / `typeName` ascending.

---

## GraphQL schema

The schema is code-first (`autoSchemaFile: true` in `AppModule`). Equivalent SDL:

```graphql
type Query {
  """Paginated makes, each with nested vehicle types. Defaults: skip=0, take=10."""
  getMakes(skip: Int = 0, take: Int = 10): [Make!]!
}

type Make {
  makeId: String!
  makeName: String!
  vehicleTypes: [MakeVehicleType!]!
}

type MakeVehicleType {
  typeId: String!
  typeName: String!
}
```

`makeId` and `typeId` are GraphQL strings even though they are integers in PostgreSQL.

Reads go through Redis first (`makes:{version}:page:{skip}:{take}`). A cache miss loads Postgres and stores the page for `MAKES_CACHE_TTL_SECONDS`. Sync invalidates by incrementing `makes:version` so old pages expire naturally.

If listing fails, the resolver returns `[]` rather than an error.

### Example queries

Default page (10 makes):

```graphql
query Makes {
  getMakes {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}
```

Custom pagination:

```graphql
query MakesPage {
  getMakes(skip: 20, take: 5) {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}
```

cURL:

```bash
curl -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ getMakes(skip: 0, take: 2) { makeId makeName vehicleTypes { typeId typeName } } }"}'
```

Example response:

```json
{
  "data": {
    "getMakes": [
      {
        "makeId": "440",
        "makeName": "ASTON MARTIN",
        "vehicleTypes": [
          { "typeId": "2", "typeName": "Passenger Car" },
          { "typeId": "7", "typeName": "Multipurpose Passenger Vehicle (MPV)" }
        ]
      }
    ]
  }
}
```

---

# API documentation

## Internal ingestion pipeline

Triggered by `POST /makes/sync`. The HTTP handler returns immediately (`void` fire-and-forget); work continues in `SyncMakesUseCase`.

```
POST /makes/sync
        │
        ▼
  getAllMakes (vPIC XML)
        │
        ▼
  parse + validate Make entities
  (skip invalid rows)
        │
        ▼
  upsert makes in chunks of 100
        │
        ▼
  invalidate Redis listing cache
        │
        ▼
  for each make:
        getVehicleTypesForMakeId (vPIC XML)
        parse + validate VehicleType entities
        upsert types
        invalidate Redis listing cache
```

vPIC calls (HTTP client timeout 20s):

| Step | Request |
|---|---|
| All makes | `GET {VPIC_BASE_URL}/api/vehicles/getallmakes?format=XML` |
| Types for a make | `GET {VPIC_BASE_URL}/api/vehicles/GetVehicleTypesForMakeId/{makeId}?format=XML` |

XML is validated, then parsed with `fast-xml-parser`. Single-item vPIC result sets are normalized to arrays.

Persistence is idempotent: Prisma `upsert` on `makeId` and on `(makeId, typeId)`. After makes are stored, the listing cache is invalidated; each successful vehicle-type batch invalidates it again so GraphQL clients see types as they land.

## Error handling strategy

The pipeline is fail-soft: a bad row or a failed make must not abort the rest of the ingest, and the sync HTTP endpoint does not wait for or surface ingest errors.

| Failure | Behavior |
|---|---|
| vPIC HTTP / empty body | Log `API request failed`; skip that fetch (empty result). |
| Invalid XML | Log `XML parsing error`; skip that payload. |
| Mapping / domain validation | Log `Transformation error`; skip that row. |
| Database upsert | Log `Datastore insertion error`. Per-row errors in `saveMany` are isolated; a chunk-level failure stops the current sync step (no cache invalidation, no type sync if makes failed). |
| Redis cache read/write/invalidate | Log `unexpected exception`; reads fall through to Postgres; writes/invalidates are skipped. |
| `getMakes` unexpected error | Log and return `[]`. |

HTTP (non-GraphQL): `UnexpectedExceptionFilter` maps `HttpException` to its status and message; anything else is logged as `unexpected exception` and returned as `500 Internal server error`.

GraphQL: Apollo `formatError` logs the original error and returns the formatted GraphQL error.

Process: `uncaughtException` is fatal (`process.exit(1)`); `unhandledRejection` is logged; `SIGTERM` / `SIGINT` log shutdown. Prisma connect failure during module init is logged and rethrown so the process does not serve traffic without a database.

Startup configuration errors throw `Invalid configuration: ...` before the server listens.

## Logging strategy

[Pino](https://getpino.io/) is the process logger (`src/logger.ts`). NestJS logging is forwarded through a `LoggerService` adapter. Logs are JSON on stdout (no pretty-printer in production).

- **Level:** `LOG_LEVEL` (see environment variables).
- **Test:** logging is disabled when `NODE_ENV=test`.
- **Shape:** message string plus structured fields (`err`, `url`, `makeId`, `port`, `context`, …). Prefer `err` for exceptions so Pino serializes the stack.

Recurring messages:

| Message | Typical meaning |
|---|---|
| `starting app` / `app started` | Bootstrap. |
| `API request failed` | vPIC HTTP error or empty body. |
| `XML parsing error` | Invalid or unparsable vPIC XML. |
| `Transformation error` | Catalog row failed mapping or domain validation. |
| `Datastore insertion error` | Prisma upsert failed. |
| `unexpected exception` | Unclassified failure (HTTP filter, GraphQL, cache, Redis, listing). |
| `failed to start` | Bootstrap threw. |
| `shutting down` | `SIGTERM` / `SIGINT`. |

## Configuration approach

1. **Load** — `dotenv` reads `.env` without overriding variables already set (Compose, Kubernetes, a local shell). `ConfigModule` is global with `ignoreEnvFile: true`; Nest uses `process.env` only.
2. **Default** — `withDefaults()` fills `LOG_LEVEL`, `DATABASE_URL`, and `REDIS_URL` for non-production. Production must supply database and Redis URLs.
3. **Validate** — Zod `envSchema` coerces types (`PORT`, `MAKES_CACHE_TTL_SECONDS`), checks enums and URL shape, and throws a single `Invalid configuration` error with issue paths if anything is wrong.
4. **Inject** — `ConfigService<Env, true>` is the only runtime config API (Prisma adapter, Redis client, vPIC `baseUrl`, cache TTL, listen port).

Prisma CLI uses the same `DATABASE_URL` via `prisma7.config.ts`.

---

## Tests

```bash
npm test          # unit
npm run test:e2e  # e2e
npm run test:cov  # coverage
npm run lint      # oxlint
```

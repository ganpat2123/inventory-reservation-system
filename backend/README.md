
# Inventory Reservation System — Backend

A REST API built with Node.js, Express.js, and PostgreSQL to manage product inventory and stock reservations safely.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Swagger / OpenAPI
- Node.js Built-in Test Runner

## Features

- Create and view products
- Unique product SKU
- Available stock management
- Create stock reservations
- Confirm reservations
- Release reservations and restore stock
- Automatic reservation expiry after 10 minutes
- Reservation history
- Idempotency-Key support
- Concurrency-safe stock updates
- Validation and error handling
- Swagger API documentation

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create PostgreSQL database

Create a database named:

```text
inventory_reservation_db
```

Import the database schema from:

```text
database/schema.sql
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=inventory_reservation_db
```

Replace the placeholder password with your own PostgreSQL password.

### 4. Run backend

```bash
node src/app.js
```

Backend URL:

```text
http://localhost:5000
```

## Swagger Documentation

Open:

```text
http://localhost:5000/api-docs
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Health check |
| POST | /api/products | Create product |
| GET | /api/products | List products |
| GET | /api/products/:id | Product details |
| POST | /api/reservations | Create reservation |
| GET | /api/reservations | Reservation history |
| GET | /api/reservations/:id | Reservation details |
| POST | /api/reservations/:id/confirm | Confirm reservation |
| POST | /api/reservations/:id/release | Release reservation |
| POST | /api/reservations/expire | Process expired reservations |

## Reservation History Filters

The GET /api/reservations endpoint supports optional query parameters.

| Parameter | Example | Description |
|---|---|---|
| date | 2026-10-25 | Filter by reservation creation date |
| status | CONFIRMED | Filter by reservation status |
| product_id | Product UUID | Filter by product |
| search | Samsung | Search by product name or SKU |

Example:

GET /api/reservations?date=2026-10-25&status=CONFIRMED

Filters can be combined. The response contains matching reservations in the data array.

Date filtering uses the PostgreSQL session timezone.

## Reservation Lifecycle

1. A reservation is created with `PENDING` status.
2. Available product stock decreases immediately.
3. Confirmation changes the reservation status to `CONFIRMED` without deducting stock again.
4. Release changes the status to `RELEASED` and restores stock.
5. Pending reservations expire after 10 minutes, changing status to `EXPIRED` and restoring stock.

## Concurrency Safety

Stock is deducted using a conditional PostgreSQL `UPDATE` inside a database transaction:

```sql
UPDATE products
SET available_quantity = available_quantity - $1
WHERE id = $2 AND available_quantity >= $1;
```

PostgreSQL handles concurrent updates safely by locking affected rows and checking the update condition. This prevents available stock from becoming negative.

## Idempotency

The create reservation endpoint requires an `Idempotency-Key` header.

- Same key and same request body: returns the original reservation.
- Same key and different request body: returns HTTP `409 Conflict`.
- Different keys: treated as separate reservation attempts.

A request hash is stored in PostgreSQL. Transaction-scoped advisory locks help prevent duplicate reservations from simultaneous requests using the same key.

## Automated Tests

Run individual test files:

```bash
node --test tests/product.test.js
node --test tests/reservation.test.js
node --test tests/concurrency.test.js
node --test tests/api.test.js
node --test tests/reservationFilters.test.js
```

Run all tests:

```bash
node --test
```

Tests cover product management, reservations, stock updates, confirmation, release, expiry, idempotency, concurrency, and HTTP API flows.

**Testing note:** Tests create temporary records in PostgreSQL. Use a local development or dedicated test database, not a production database.

## Frontend

The React frontend is maintained in the sibling `frontend` directory and communicates with this backend through HTTP APIs.

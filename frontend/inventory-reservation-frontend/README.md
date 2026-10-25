
# Inventory Reservation System — Frontend

A responsive inventory management application built with React, Vite, Tailwind CSS, and React Router.

## Features

- Product listing with search and stock filters
- Product details and real-time stock availability
- Create products with validation
- Reserve product inventory
- Confirm or release pending reservations
- Reservation history with search, status, and date filters
- Reservation expiry countdown
- Idempotency-Key support for safe reservation retries
- Loading, empty, success, and error states
- Responsive desktop and mobile layouts

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React

## Prerequisites

- Node.js and npm
- Running Inventory Reservation System backend
- PostgreSQL configured for the backend

## Installation

Open the frontend project directory and install dependencies:

```bash
npm install
```

## Environment Configuration

Create or update a `.env` file in the frontend project root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Change the URL if the backend is running on another host or port.

## Run Frontend

```bash
npm run dev
```

Open the local URL displayed by Vite, normally:

http://localhost:5173

## Run Backend

From the backend project directory:

```bash
npm install
node src/app.js
```

Ensure the backend PostgreSQL database and environment variables are configured.

## Application Flow

1. Open the Dashboard to view inventory statistics.
2. Open Products to browse inventory.
3. Create a new product using Add Product.
4. Open Product Details and reserve a positive quantity.
5. A pending reservation immediately reduces available stock.
6. Confirm the reservation to keep the stock allocated.
7. Release the reservation to restore stock.
8. Unconfirmed pending reservations expire after approximately 10 minutes, and the backend restores stock.
9. Use Reservations to view history and filter by product, date, or status.

## Idempotency

Each new reservation attempt uses a unique `Idempotency-Key` header.

A retry of the same request reuses its original key to prevent duplicate reservations.

The backend is responsible for enforcing idempotency and concurrency-safe stock updates.

## API Documentation

Swagger documentation is available at:

http://localhost:5000/api-docs

## Production Build

```bash
npm run build
```

## Code Quality

```bash
npm run lint
```

## Notes

- The frontend uses the real backend API, not mock inventory data.
- Reservation state and stock availability are controlled by the backend.
- The frontend disables invalid reservation actions.
- The `.env` file is excluded from version control and should be configured separately.

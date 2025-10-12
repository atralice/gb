# TypeScript Prisma Zod Bun Boilerplate

A minimal, modern boilerplate for building TypeScript projects with Prisma ORM, Zod validation, and Bun for testing.

## Prerequisites

- Node.js (v22 or higher)
- Bun (latest version)
- PostgreSQL (for Prisma)

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
APP_ENV=development
```

## Installation

```bash
# Install dependencies
yarn
```

## Usage

```bash
# Run tests
bun test

# Lint code
yarn lint

# Open Prisma Studio
yarn prisma:studio
```

## Features

- TypeScript-first, strict type safety
- Prisma ORM for database access
- Zod for schema validation
- Bun for fast testing
- Minimal, extensible structure

## License

MIT

# NestJS Todo App

A production-ready NestJS 12 todo API with Prisma + PostgreSQL (Neon), Swagger docs, JWT auth (access + refresh tokens), cursor pagination, rate limiting, global error handling, and validation.

## Stack
- NestJS 12, TypeScript ESM (nodenext), vitest, oxlint, prettier
- Prisma 6 + Neon PostgreSQL
- @nestjs/swagger, @nestjs/config, @nestjs/throttler, @nestjs/passport, @nestjs/jwt, bcrypt, class-validator, class-transformer

## Setup

### Prerequisites
- Node.js 20+
- npm
- A Neon PostgreSQL database (https://neon.tech)

### Install dependencies
```bash
npm install
```

### Configure environment
Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://...?sslmode=require"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
PORT=3000
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Database setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed admin user
npx prisma db seed
```

## Running

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Testing

### Unit tests
```bash
npm run test
```

### E2E tests
```bash
npm run test:e2e
```

### Test coverage
```bash
npm run test:cov
```

## Swagger Docs
After starting the server, visit: http://localhost:3000/api/docs

## API Endpoints

### Auth
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke refresh token)
- `POST /auth/logout-all` - Logout all devices

### Todos (authenticated)
- `GET /todos` - List todos with cursor pagination
- `GET /todos/:id` - Get a todo by id
- `POST /todos` - Create a new todo
- `PATCH /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo

### Health
- `GET /` - Health check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_ACCESS_TTL` | Access token TTL in seconds | `900` |
| `JWT_REFRESH_TTL` | Refresh token TTL in seconds | `604800` |
| `PORT` | Server port | `3000` |
| `THROTTLE_TTL` | Throttle time window in ms | `60000` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `NODE_ENV` | Node environment | `development` |

## Scripts
- `npm run build` - Build the project
- `npm run start` - Start the server
- `npm run start:dev` - Start in watch mode
- `npm run lint` - Run oxlint
- `npm run format` - Format with prettier
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
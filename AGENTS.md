# AGENTS.md

## Project Overview
NestJS 12 todo API with Prisma + PostgreSQL (Neon), Swagger docs, JWT auth, cursor pagination, rate limiting.

## Commands

### Build & Run
- `npm run build` - Build the project
- `npm run start` - Start the server
- `npm run start:dev` - Start in watch mode
- `npm run start:prod` - Start production build

### Testing
- `npm run test` - Run unit tests (vitest)
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run tests with coverage

### Lint & Format
- `npm run lint` - Run oxlint on src/ and test/
- `npm run format` - Format with prettier

### Prisma
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create/update migrations
- `npx prisma db seed` - Run seed script

## Conventions

### ESM
All imports must use `.js` extensions (e.g., `./app.module.js`).

### Code Style
- Single quotes
- Trailing commas
- No comments unless explicitly requested
- Feature-first module layout (`src/auth/`, `src/todos/`, `src/common/`, `src/config/`, `src/prisma/`)

### DTOs
- Always decorate with `@ApiProperty{...}` from `@nestjs/swagger`
- Use `class-validator` decorators for validation
- Place DTOs in `src/<feature>/dto/`

### Error Handling
- Global `HttpExceptionFilter` returns `{ statusCode, message, error, timestamp, path }`
- Prisma unique violation -> 409
- Prisma not found -> 404

### Auth
- Access token: short-lived JWT (HS256)
- Refresh token: cryptographically random opaque string; store SHA-256 hash
- Refresh token rotation on refresh; revoke on logout/logout-all
- Use `@User()` decorator to access authenticated user
- Protect routes with `@UseGuards(JwtGuard)`

### Pagination
- Cursor-based: `cursor` (todo id) + `limit`
- Return `nextCursor` when more results exist
- Max limit: 100, default: 20

### Validation
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- Validate env vars on startup with `class-validator`
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import {
  User,
  RefreshToken,
  Todo,
  Priority as PrismaPriority,
} from '@prisma/client';

process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
process.env.JWT_ACCESS_TTL = '900';
process.env.JWT_REFRESH_TTL = '604800';
process.env.PORT = '0';
process.env.THROTTLE_TTL = '60000';
process.env.THROTTLE_LIMIT = '100';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.todo.deleteMany({});
    await prisma.user.deleteMany({});

    const passwordHash = await hash('password123', 10);
    const user = await prisma.user.create({
      data: { email: 'test@example.com', passwordHash },
    });
    userId = user.id;
    accessToken = sign({ sub: userId }, 'test-secret', { expiresIn: 900 });
    const token = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 604800);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    refreshToken = token;
  });

  it('/ (GET) - health check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ status: 'ok' });
  });

  describe('Auth', () => {
    it('POST /auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@example.com', password: 'password123' })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('POST /auth/register - should return 409 if email exists', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(409);
    });

    it('POST /auth/login - should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('POST /auth/login - should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('POST /auth/refresh - should return new tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('POST /auth/logout - should revoke refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);
    });
  });

  describe('Todos', () => {
    let todoId: string;

    it('POST /todos - should create a todo', async () => {
      const response = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Todo', description: 'A test todo' })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Test Todo');
      todoId = response.body.id;
    });

    it('GET /todos - should list todos', async () => {
      await prisma.todo.create({
        data: {
          title: 'Todo 1',
          ownerId: userId,
          priority: PrismaPriority.MEDIUM,
        },
      });
      const response = await request(app.getHttpServer())
        .get('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Todo 1');
      expect(response.body.total).toBe(1);
      expect(response.body.nextCursor).toBeNull();
    });

    it('GET /todos/:id - should get a todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Single Todo',
          ownerId: userId,
          priority: PrismaPriority.MEDIUM,
        },
      });
      const response = await request(app.getHttpServer())
        .get(`/todos/${todo.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.title).toBe('Single Todo');
    });

    it('GET /todos/:id - should return 404 if not found', async () => {
      await request(app.getHttpServer())
        .get('/todos/nonexistent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('PATCH /todos/:id - should update a todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Old Title',
          ownerId: userId,
          priority: PrismaPriority.MEDIUM,
        },
      });
      const response = await request(app.getHttpServer())
        .patch(`/todos/${todo.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title', completed: true })
        .expect(200);

      expect(response.body.title).toBe('New Title');
      expect(response.body.completed).toBe(true);
    });

    it('DELETE /todos/:id - should delete a todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'To Delete',
          ownerId: userId,
          priority: PrismaPriority.MEDIUM,
        },
      });
      await request(app.getHttpServer())
        .delete(`/todos/${todo.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('POST /todos - should validate input', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '', password: 'invalid' })
        .expect(400);
    });

    it('GET /todos - should paginate', async () => {
      for (let i = 0; i < 5; i++) {
        await prisma.todo.create({
          data: {
            title: `Todo ${i}`,
            ownerId: userId,
            priority: PrismaPriority.MEDIUM,
          },
        });
      }
      const response = await request(app.getHttpServer())
        .get('/todos?limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.nextCursor).not.toBeNull();
      expect(response.body.total).toBe(5);
    });
  });
});

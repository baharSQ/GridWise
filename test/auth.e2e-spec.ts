import { webcrypto } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

type RegisteredUserResponse = {
  id: string;
  email: string;
  createdAt: string;
};

type LoginResponse = {
  accessToken: string;
};

type ApiError = {
  message: string | string[];
  statusCode: number;
};

function bodyAs<T>(response: Response): T {
  return response.body as T;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const uniqueEmail = () =>
    `gridwise_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers successfully', async () => {
    const email = uniqueEmail();
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'StrongPass123!',
      })
      .expect(201);
    const registeredUser = bodyAs<RegisteredUserResponse>(response);

    expect(registeredUser.id).toBeDefined();
    expect(registeredUser.email).toBe(email.toLowerCase());
    expect((response.body as Record<string, unknown>).password).toBeUndefined();
    expect(
      (response.body as Record<string, unknown>).passwordHash,
    ).toBeUndefined();
  });

  it('rejects duplicate registration', async () => {
    const email = uniqueEmail();
    const payload = {
      email,
      password: 'StrongPass123!',
    };

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(payload)
      .expect(409);
    const error = bodyAs<ApiError>(duplicateResponse);

    expect(error.message).toContain('already registered');
  });

  it('logs in successfully', async () => {
    const email = uniqueEmail();
    const password = 'StrongPass123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const loginResult = bodyAs<LoginResponse>(loginResponse);

    expect(loginResult.accessToken).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const email = uniqueEmail();
    const password = 'StrongPass123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass123!' })
      .expect(401);
  });

  it('rejects protected endpoint without token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('allows protected endpoint with valid token', async () => {
    const email = uniqueEmail();
    const password = 'StrongPass123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const loginResult = bodyAs<LoginResponse>(loginResponse);

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResult.accessToken}`)
      .expect(200);
    const me = bodyAs<RegisteredUserResponse>(meResponse);

    expect(me.email).toBe(email.toLowerCase());
    expect(
      (meResponse.body as Record<string, unknown>).passwordHash,
    ).toBeUndefined();
  });
});

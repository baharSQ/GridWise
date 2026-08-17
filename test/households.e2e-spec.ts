import { webcrypto } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

type RegisteredUser = {
  id: string;
  email: string;
  createdAt: string;
};

type LoginResult = {
  accessToken: string;
};

type HouseholdResponse = {
  id: string;
  userId: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

type ApiError = {
  message: string | string[];
  error: string;
  statusCode: number;
};

function bodyAs<T>(response: Response): T {
  return response.body as T;
}

describe('Households (e2e)', () => {
  let app: INestApplication<App>;

  const uniqueEmail = () =>
    `gridwise_households_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

  async function registerAndLogin() {
    const email = uniqueEmail();
    const password = 'StrongPass123!';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);
    const registeredUser = bodyAs<RegisteredUser>(registerResponse);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const loginResult = bodyAs<LoginResult>(loginResponse);

    return {
      user: registeredUser,
      accessToken: loginResult.accessToken,
    };
  }

  async function createHousehold(
    accessToken: string,
    name: string,
    timezone: string,
  ): Promise<HouseholdResponse> {
    const response = await request(app.getHttpServer())
      .post('/api/households')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, timezone })
      .expect(201);

    return bodyAs<HouseholdResponse>(response);
  }

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

  it('authenticated user can create a household', async () => {
    const { user, accessToken } = await registerAndLogin();

    const createdHousehold = await createHousehold(
      accessToken,
      'Home',
      'Europe/Berlin',
    );

    expect(createdHousehold.id).toBeDefined();
    expect(createdHousehold.userId).toBe(user.id);
    expect(createdHousehold.name).toBe('Home');
    expect(createdHousehold.timezone).toBe('Europe/Berlin');
  });

  it('unauthenticated request returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/households')
      .send({ name: 'NoAuth', timezone: 'Europe/Berlin' })
      .expect(401);
  });

  it('user can list only their own households', async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();

    const householdA1 = await createHousehold(
      userA.accessToken,
      'A-1',
      'Europe/Berlin',
    );
    const householdA2 = await createHousehold(
      userA.accessToken,
      'A-2',
      'Europe/Paris',
    );
    const householdB1 = await createHousehold(
      userB.accessToken,
      'B-1',
      'America/New_York',
    );

    const listResponse = await request(app.getHttpServer())
      .get('/api/households')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .expect(200);

    const households = bodyAs<HouseholdResponse[]>(listResponse);
    const householdIds = households.map((household) => household.id);

    expect(
      households.every((household) => household.userId === userA.user.id),
    ).toBe(true);
    expect(householdIds).toContain(householdA1.id);
    expect(householdIds).toContain(householdA2.id);
    expect(householdIds).not.toContain(householdB1.id);
  });

  it('user can retrieve their own household', async () => {
    const { accessToken } = await registerAndLogin();
    const createdHousehold = await createHousehold(
      accessToken,
      'My Home',
      'Europe/Berlin',
    );

    const getResponse = await request(app.getHttpServer())
      .get(`/api/households/${createdHousehold.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const household = bodyAs<HouseholdResponse>(getResponse);
    expect(household.id).toBe(createdHousehold.id);
    expect(household.name).toBe('My Home');
  });

  it("user cannot retrieve another user's household", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();

    const ownerHousehold = await createHousehold(
      owner.accessToken,
      'Owner Home',
      'Europe/Berlin',
    );

    await request(app.getHttpServer())
      .get(`/api/households/${ownerHousehold.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);
  });

  it('returns validation errors for invalid household payload', async () => {
    const { accessToken } = await registerAndLogin();
    const tooLongTimezone = 'x'.repeat(101);

    const response = await request(app.getHttpServer())
      .post('/api/households')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        timezone: tooLongTimezone,
      })
      .expect(400);

    const error = bodyAs<ApiError>(response);
    expect(error.statusCode).toBe(400);
    expect(Array.isArray(error.message)).toBe(true);
  });
});

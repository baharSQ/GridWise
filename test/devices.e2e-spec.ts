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

type DeviceType = 'EV_CHARGER' | 'WASHING_MACHINE' | 'DISHWASHER';

type DeviceResponse = {
  id: string;
  householdId: string;
  name: string;
  deviceType: DeviceType;
  nominalPowerKw: number;
  isFlexible: boolean;
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

describe('Devices (e2e)', () => {
  let app: INestApplication<App>;

  const uniqueEmail = () =>
    `gridwise_devices_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

  async function registerAndLogin() {
    const email = uniqueEmail();
    const password = 'StrongPass123!';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);
    const user = bodyAs<RegisteredUser>(registerResponse);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const loginResult = bodyAs<LoginResult>(loginResponse);

    return {
      user,
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

  async function createDevice(
    accessToken: string,
    householdId: string,
    payload?: Partial<{
      name: string;
      deviceType: DeviceType;
      nominalPowerKw: number;
      isFlexible: boolean;
    }>,
  ): Promise<DeviceResponse> {
    const response = await request(app.getHttpServer())
      .post(`/api/households/${householdId}/devices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Charger',
        deviceType: 'EV_CHARGER',
        nominalPowerKw: 11,
        ...payload,
      })
      .expect(201);

    return bodyAs<DeviceResponse>(response);
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

  it('authenticated user can create a device', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken, 'Home', 'Europe/Berlin');

    const device = await createDevice(accessToken, household.id);

    expect(device.id).toBeDefined();
    expect(device.householdId).toBe(household.id);
    expect(device.deviceType).toBe('EV_CHARGER');
    expect(device.nominalPowerKw).toBe(11);
    expect(device.isFlexible).toBe(true);
  });

  it('unauthenticated request returns 401', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken, 'Home', 'Europe/Berlin');

    await request(app.getHttpServer())
      .post(`/api/households/${household.id}/devices`)
      .send({
        name: 'Dishwasher',
        deviceType: 'DISHWASHER',
        nominalPowerKw: 2,
      })
      .expect(401);
  });

  it('user can list devices from their household', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken, 'List Home', 'Europe/Paris');
    const deviceA = await createDevice(accessToken, household.id, {
      name: 'Washer',
      deviceType: 'WASHING_MACHINE',
      nominalPowerKw: 1.8,
    });
    const deviceB = await createDevice(accessToken, household.id, {
      name: 'Dishwasher',
      deviceType: 'DISHWASHER',
      nominalPowerKw: 2.1,
      isFlexible: false,
    });

    const listResponse = await request(app.getHttpServer())
      .get(`/api/households/${household.id}/devices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const devices = bodyAs<DeviceResponse[]>(listResponse);
    const deviceIds = devices.map((device) => device.id);

    expect(deviceIds).toContain(deviceA.id);
    expect(deviceIds).toContain(deviceB.id);
    expect(devices.every((device) => device.householdId === household.id)).toBe(true);
  });

  it("user cannot access another user's household devices", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const ownerHousehold = await createHousehold(
      owner.accessToken,
      'Owner Home',
      'Europe/Berlin',
    );
    await createDevice(owner.accessToken, ownerHousehold.id);

    await request(app.getHttpServer())
      .get(`/api/households/${ownerHousehold.id}/devices`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);
  });

  it("user cannot update another user's device", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const household = await createHousehold(
      owner.accessToken,
      'Update Home',
      'Europe/Berlin',
    );
    const device = await createDevice(owner.accessToken, household.id);

    await request(app.getHttpServer())
      .patch(`/api/devices/${device.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ name: 'Intruder Edit' })
      .expect(403);
  });

  it("user cannot delete another user's device", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const household = await createHousehold(
      owner.accessToken,
      'Delete Home',
      'Europe/Berlin',
    );
    const device = await createDevice(owner.accessToken, household.id);

    await request(app.getHttpServer())
      .delete(`/api/devices/${device.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);
  });

  it('returns validation errors for invalid payload', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(
      accessToken,
      'Validation Home',
      'Europe/Berlin',
    );

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/devices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: '',
        deviceType: 'INVALID_TYPE',
        nominalPowerKw: -1,
      })
      .expect(400);

    const error = bodyAs<ApiError>(response);
    expect(error.statusCode).toBe(400);
    expect(Array.isArray(error.message)).toBe(true);
  });

  it('updates a device successfully', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken, 'Update OK', 'Europe/Berlin');
    const device = await createDevice(accessToken, household.id, {
      deviceType: 'DISHWASHER',
      nominalPowerKw: 2.2,
    });

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/devices/${device.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Device',
        deviceType: 'WASHING_MACHINE',
        nominalPowerKw: 1.9,
        isFlexible: false,
      })
      .expect(200);

    const updatedDevice = bodyAs<DeviceResponse>(updateResponse);
    expect(updatedDevice.id).toBe(device.id);
    expect(updatedDevice.name).toBe('Updated Device');
    expect(updatedDevice.deviceType).toBe('WASHING_MACHINE');
    expect(updatedDevice.nominalPowerKw).toBe(1.9);
    expect(updatedDevice.isFlexible).toBe(false);
  });

  it('deletes a device successfully', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken, 'Delete OK', 'Europe/Berlin');
    const device = await createDevice(accessToken, household.id);

    await request(app.getHttpServer())
      .delete(`/api/devices/${device.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const listResponse = await request(app.getHttpServer())
      .get(`/api/households/${household.id}/devices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const devices = bodyAs<DeviceResponse[]>(listResponse);
    expect(devices.some((entry) => entry.id === device.id)).toBe(false);
  });
});

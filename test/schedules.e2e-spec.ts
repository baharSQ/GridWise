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
};

type LoginResult = {
  accessToken: string;
};

type HouseholdResponse = {
  id: string;
};

type DeviceType = 'EV_CHARGER' | 'WASHING_MACHINE' | 'DISHWASHER';

type DeviceResponse = {
  id: string;
  householdId: string;
  isFlexible: boolean;
};

type ScheduleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

type ScheduleResponse = {
  id: string;
  householdId: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  targetPowerKw: number;
  status: ScheduleStatus;
};

type OptimizeResponse = {
  feasible: boolean;
  totalRequestedPowerKw: number;
  powerLimitKw: number;
  conflicts: Array<{
    startTime: string;
    endTime: string;
    totalRequestedPowerKw: number;
    powerLimitKw: number;
    scheduleIds: string[];
  }>;
  recommendedOrder: string[];
  recommendedSchedules: Array<{
    scheduleId: string;
    isFlexible: boolean;
    recommendation: 'KEEP' | 'MOVE_IF_NEEDED' | 'DELAY';
  }>;
};

type ApiError = {
  message: string | string[];
  statusCode: number;
};

function bodyAs<T>(response: Response): T {
  return response.body as T;
}

describe('Schedules (e2e)', () => {
  let app: INestApplication<App>;

  const uniqueEmail = () =>
    `gridwise_schedules_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;

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

    return { user, accessToken: loginResult.accessToken };
  }

  async function createHousehold(
    accessToken: string,
  ): Promise<HouseholdResponse> {
    const response = await request(app.getHttpServer())
      .post('/api/households')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Home', timezone: 'Europe/Berlin' })
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
        name: 'Device',
        deviceType: 'EV_CHARGER',
        nominalPowerKw: 7.2,
        ...payload,
      })
      .expect(201);

    return bodyAs<DeviceResponse>(response);
  }

  async function createSchedule(
    accessToken: string,
    householdId: string,
    deviceId: string,
    payload?: Partial<{
      startTime: string;
      endTime: string;
      targetPowerKw: number;
      status: ScheduleStatus;
    }>,
  ): Promise<ScheduleResponse> {
    const response = await request(app.getHttpServer())
      .post(`/api/households/${householdId}/schedules`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId,
        startTime: '2026-08-18T08:00:00.000Z',
        endTime: '2026-08-18T10:00:00.000Z',
        targetPowerKw: 3.5,
        ...payload,
      })
      .expect(201);

    return bodyAs<ScheduleResponse>(response);
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

  it('authenticated user can create a schedule', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const device = await createDevice(accessToken, household.id);

    const schedule = await createSchedule(accessToken, household.id, device.id);

    expect(schedule.id).toBeDefined();
    expect(schedule.householdId).toBe(household.id);
    expect(schedule.deviceId).toBe(device.id);
    expect(schedule.status).toBe('PENDING');
  });

  it('unauthenticated request returns 401', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const device = await createDevice(accessToken, household.id);

    await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules`)
      .send({
        deviceId: device.id,
        startTime: '2026-08-18T08:00:00.000Z',
        endTime: '2026-08-18T10:00:00.000Z',
        targetPowerKw: 3,
      })
      .expect(401);
  });

  it("user cannot create a schedule for another user's device", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();

    const ownerHousehold = await createHousehold(owner.accessToken);
    const ownerDevice = await createDevice(
      owner.accessToken,
      ownerHousehold.id,
    );
    const intruderHousehold = await createHousehold(intruder.accessToken);

    await request(app.getHttpServer())
      .post(`/api/households/${intruderHousehold.id}/schedules`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({
        deviceId: ownerDevice.id,
        startTime: '2026-08-18T08:00:00.000Z',
        endTime: '2026-08-18T10:00:00.000Z',
        targetPowerKw: 3,
      })
      .expect(403);
  });

  it('user can list their schedules', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const device = await createDevice(accessToken, household.id);
    const scheduleA = await createSchedule(
      accessToken,
      household.id,
      device.id,
      {
        startTime: '2026-08-18T06:00:00.000Z',
        endTime: '2026-08-18T07:00:00.000Z',
      },
    );
    const scheduleB = await createSchedule(
      accessToken,
      household.id,
      device.id,
      {
        startTime: '2026-08-18T07:00:00.000Z',
        endTime: '2026-08-18T08:00:00.000Z',
      },
    );

    const listResponse = await request(app.getHttpServer())
      .get(`/api/households/${household.id}/schedules`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const schedules = bodyAs<ScheduleResponse[]>(listResponse);
    const ids = schedules.map((item) => item.id);
    expect(ids).toContain(scheduleA.id);
    expect(ids).toContain(scheduleB.id);
  });

  it("user cannot access another user's schedule", async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const household = await createHousehold(owner.accessToken);
    const device = await createDevice(owner.accessToken, household.id);
    const schedule = await createSchedule(
      owner.accessToken,
      household.id,
      device.id,
    );

    await request(app.getHttpServer())
      .get(`/api/schedules/${schedule.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(403);
  });

  it('returns validation errors', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const device = await createDevice(accessToken, household.id);

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId: device.id,
        startTime: '2026-08-18T12:00:00.000Z',
        endTime: '2026-08-18T10:00:00.000Z',
        targetPowerKw: -1,
      })
      .expect(400);

    const error = bodyAs<ApiError>(response);
    expect(error.statusCode).toBe(400);
  });

  it('overlapping schedules are detected', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const deviceA = await createDevice(accessToken, household.id, {
      name: 'Flex',
      isFlexible: true,
    });
    const deviceB = await createDevice(accessToken, household.id, {
      name: 'Fixed',
      isFlexible: false,
    });
    await createSchedule(accessToken, household.id, deviceA.id, {
      startTime: '2026-08-18T08:00:00.000Z',
      endTime: '2026-08-18T10:00:00.000Z',
      targetPowerKw: 4,
    });
    await createSchedule(accessToken, household.id, deviceB.id, {
      startTime: '2026-08-18T09:00:00.000Z',
      endTime: '2026-08-18T11:00:00.000Z',
      targetPowerKw: 4,
    });

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules/optimize`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ maxPowerKw: 6 })
      .expect(201);
    const result = bodyAs<OptimizeResponse>(response);

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.feasible).toBe(false);
  });

  it('schedules within power limit are feasible', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const deviceA = await createDevice(accessToken, household.id, {
      isFlexible: true,
    });
    const deviceB = await createDevice(accessToken, household.id, {
      name: 'Fixed2',
      isFlexible: false,
    });
    await createSchedule(accessToken, household.id, deviceA.id, {
      startTime: '2026-08-18T08:00:00.000Z',
      endTime: '2026-08-18T10:00:00.000Z',
      targetPowerKw: 2,
    });
    await createSchedule(accessToken, household.id, deviceB.id, {
      startTime: '2026-08-18T08:30:00.000Z',
      endTime: '2026-08-18T09:30:00.000Z',
      targetPowerKw: 2.5,
    });

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules/optimize`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ maxPowerKw: 6 })
      .expect(201);
    const result = bodyAs<OptimizeResponse>(response);

    expect(result.feasible).toBe(true);
    expect(result.totalRequestedPowerKw).toBeLessThanOrEqual(6);
    expect(result.conflicts).toHaveLength(0);
  });

  it('schedules exceeding power limit are detected', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const deviceA = await createDevice(accessToken, household.id, {
      isFlexible: true,
    });
    const deviceB = await createDevice(accessToken, household.id, {
      isFlexible: false,
    });
    await createSchedule(accessToken, household.id, deviceA.id, {
      targetPowerKw: 4,
    });
    await createSchedule(accessToken, household.id, deviceB.id, {
      startTime: '2026-08-18T09:00:00.000Z',
      endTime: '2026-08-18T11:00:00.000Z',
      targetPowerKw: 3.5,
    });

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules/optimize`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ maxPowerKw: 6 })
      .expect(201);
    const result = bodyAs<OptimizeResponse>(response);

    expect(result.feasible).toBe(false);
    expect(result.totalRequestedPowerKw).toBeGreaterThan(6);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('flexible devices are prioritized for rescheduling', async () => {
    const { accessToken } = await registerAndLogin();
    const household = await createHousehold(accessToken);
    const flexibleDevice = await createDevice(accessToken, household.id, {
      name: 'Flexible',
      isFlexible: true,
    });
    const fixedDevice = await createDevice(accessToken, household.id, {
      name: 'Fixed',
      isFlexible: false,
    });
    const flexibleSchedule = await createSchedule(
      accessToken,
      household.id,
      flexibleDevice.id,
      {
        startTime: '2026-08-18T08:00:00.000Z',
        endTime: '2026-08-18T10:00:00.000Z',
        targetPowerKw: 4,
      },
    );
    await createSchedule(accessToken, household.id, fixedDevice.id, {
      startTime: '2026-08-18T08:00:00.000Z',
      endTime: '2026-08-18T10:00:00.000Z',
      targetPowerKw: 4,
    });

    const response = await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules/optimize`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ maxPowerKw: 5 })
      .expect(201);
    const result = bodyAs<OptimizeResponse>(response);

    expect(result.recommendedOrder[0]).toBe(flexibleSchedule.id);
    expect(result.recommendedSchedules[0].isFlexible).toBe(true);
  });

  it('optimization endpoint respects household ownership', async () => {
    const owner = await registerAndLogin();
    const intruder = await registerAndLogin();
    const household = await createHousehold(owner.accessToken);

    await request(app.getHttpServer())
      .post(`/api/households/${household.id}/schedules/optimize`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ maxPowerKw: 6 })
      .expect(403);
  });
});

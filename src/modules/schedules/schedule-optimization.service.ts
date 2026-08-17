import { Injectable } from '@nestjs/common';
import { Device } from '../devices/entities/device.entity';
import { Schedule } from './entities/schedule.entity';
import {
  OptimizeSchedulesResponseDto,
  RecommendedScheduleDto,
  ScheduleConflictDto,
} from './dto/optimize-schedules-response.dto';

type ScheduleWithDevice = {
  schedule: Schedule;
  device: Device;
};

@Injectable()
export class ScheduleOptimizationService {
  optimize(
    schedules: Schedule[],
    devicesById: Map<string, Device>,
    powerLimitKw: number,
  ): OptimizeSchedulesResponseDto {
    const scheduleWithDevices = schedules
      .map((schedule) => {
        const device = devicesById.get(schedule.deviceId);
        if (!device) {
          return null;
        }
        return { schedule, device };
      })
      .filter((entry): entry is ScheduleWithDevice => entry !== null);

    const conflicts = this.detectConflicts(scheduleWithDevices, powerLimitKw);
    const totalRequestedPowerKw = conflicts.maxRequestedPowerKw;
    const feasible = conflicts.conflicts.length === 0;
    const recommendedSchedules = this.recommendSchedules(scheduleWithDevices);

    return {
      feasible,
      totalRequestedPowerKw,
      powerLimitKw,
      conflicts: conflicts.conflicts,
      recommendedOrder: recommendedSchedules.map((entry) => entry.scheduleId),
      recommendedSchedules,
    };
  }

  private detectConflicts(
    scheduleWithDevices: ScheduleWithDevice[],
    powerLimitKw: number,
  ): {
    maxRequestedPowerKw: number;
    conflicts: ScheduleConflictDto[];
  } {
    if (scheduleWithDevices.length === 0) {
      return {
        maxRequestedPowerKw: 0,
        conflicts: [],
      };
    }

    const timePoints = Array.from(
      new Set(
        scheduleWithDevices.flatMap((entry) => [
          entry.schedule.startTime.toISOString(),
          entry.schedule.endTime.toISOString(),
        ]),
      ),
    )
      .map((value) => new Date(value))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxRequestedPowerKw = 0;
    const conflicts: ScheduleConflictDto[] = [];

    for (let index = 0; index < timePoints.length - 1; index += 1) {
      const segmentStart = timePoints[index];
      const segmentEnd = timePoints[index + 1];

      if (segmentStart.getTime() === segmentEnd.getTime()) {
        continue;
      }

      const activeSchedules = scheduleWithDevices.filter((entry) => {
        const start = entry.schedule.startTime.getTime();
        const end = entry.schedule.endTime.getTime();
        return start < segmentEnd.getTime() && end > segmentStart.getTime();
      });

      if (activeSchedules.length === 0) {
        continue;
      }

      const totalPower = activeSchedules.reduce(
        (sum, entry) => sum + entry.schedule.targetPowerKw,
        0,
      );
      maxRequestedPowerKw = Math.max(maxRequestedPowerKw, totalPower);

      if (totalPower > powerLimitKw) {
        conflicts.push({
          startTime: segmentStart.toISOString(),
          endTime: segmentEnd.toISOString(),
          totalRequestedPowerKw: totalPower,
          powerLimitKw,
          scheduleIds: activeSchedules
            .map((entry) => entry.schedule.id)
            .sort((a, b) => a.localeCompare(b)),
        });
      }
    }

    return { maxRequestedPowerKw, conflicts };
  }

  private recommendSchedules(
    scheduleWithDevices: ScheduleWithDevice[],
  ): RecommendedScheduleDto[] {
    const sorted = [...scheduleWithDevices].sort((a, b) => {
      if (a.device.isFlexible !== b.device.isFlexible) {
        return a.device.isFlexible ? -1 : 1;
      }

      const startDiff =
        a.schedule.startTime.getTime() - b.schedule.startTime.getTime();
      if (startDiff !== 0) {
        return startDiff;
      }

      return a.schedule.id.localeCompare(b.schedule.id);
    });

    let nextRecommendedStart = Math.min(
      ...sorted.map((entry) => entry.schedule.startTime.getTime()),
    );

    return sorted.map((entry) => {
      const durationMs =
        entry.schedule.endTime.getTime() - entry.schedule.startTime.getTime();
      const originalStart = entry.schedule.startTime.getTime();

      const recommendedStart = entry.device.isFlexible
        ? Math.max(originalStart, nextRecommendedStart)
        : originalStart;
      const recommendedEnd = recommendedStart + durationMs;

      if (entry.device.isFlexible) {
        nextRecommendedStart = recommendedEnd;
      }

      const recommendation: RecommendedScheduleDto['recommendation'] = !entry
        .device.isFlexible
        ? 'KEEP'
        : recommendedStart === originalStart
          ? 'MOVE_IF_NEEDED'
          : 'DELAY';

      return {
        scheduleId: entry.schedule.id,
        deviceId: entry.schedule.deviceId,
        deviceName: entry.device.name,
        isFlexible: entry.device.isFlexible,
        originalStartTime: entry.schedule.startTime.toISOString(),
        originalEndTime: entry.schedule.endTime.toISOString(),
        recommendedStartTime: new Date(recommendedStart).toISOString(),
        recommendedEndTime: new Date(recommendedEnd).toISOString(),
        recommendation,
      };
    });
  }
}

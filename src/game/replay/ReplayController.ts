import { CONFIG } from "../content/config";
import type { InputSnapshot } from "../systems/InputSystem";
import type { World } from "../World";
import { ReplayBuffer } from "./ReplayBuffer";
import { ReplayInputSource } from "./ReplayInputSource";
import type {
  RecordedInput,
  ReplayData,
  ReplayFrame,
  ReplayHeader,
  ReplayNoodle,
  ReplayStatus
} from "./ReplayTypes";

export class ReplayController {
  private readonly buffer: ReplayBuffer;
  private recordingEnabled = true;
  private recordingTick = CONFIG.core.zero;
  private header: ReplayHeader | null = null;
  private playback: ReplayInputSource | null = null;

  constructor() {
    const maxFrames = Math.floor(CONFIG.replay.bufferSeconds * CONFIG.replay.tickRate);
    this.buffer = new ReplayBuffer(maxFrames);
  }

  isRecording(): boolean {
    return this.recordingEnabled && !this.isPlaying();
  }

  isPlaying(): boolean {
    return this.playback !== null;
  }

  getStatus(): ReplayStatus {
    if (this.playback) {
      return {
        mode: "playback",
        tick: this.playback.getTick(),
        totalTicks: this.playback.getTotalTicks()
      };
    }

    if (this.recordingEnabled) {
      return {
        mode: "recording",
        tick: this.recordingTick,
        totalTicks: this.buffer.getCapacity()
      };
    }

    return {
      mode: "off",
      tick: CONFIG.core.zero,
      totalTicks: CONFIG.core.zero
    };
  }

  startRecording(world: World): void {
    this.recordingEnabled = true;
    this.recordingTick = CONFIG.core.zero;
    this.buffer.clear();
    this.header = this.buildHeader(world);
  }

  stopRecording(): void {
    this.recordingEnabled = false;
  }

  toggleRecording(world: World): void {
    if (this.recordingEnabled) {
      this.stopRecording();
    } else {
      this.startRecording(world);
    }
  }

  recordTick(snapshot: InputSnapshot): void {
    if (!this.isRecording()) {
      return;
    }

    const recorded = this.toRecordedInput(snapshot);
    const frame: ReplayFrame = {
      tick: this.recordingTick,
      input: recorded
    };

    this.buffer.record(frame);
    this.recordingTick += CONFIG.core.one;
  }

  exportReplay(): ReplayData | null {
    if (!this.header) {
      return null;
    }

    const frames = this.buffer.toArray();

    if (frames.length <= CONFIG.core.zero) {
      return null;
    }

    return {
      header: this.header,
      frames
    };
  }

  loadReplay(json: string): ReplayData | null {
    try {
      const data = JSON.parse(json) as ReplayData;

      if (!data || !data.header || !Array.isArray(data.frames)) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  startPlayback(data: ReplayData): ReplayInputSource {
    this.recordingEnabled = false;
    this.playback = new ReplayInputSource(data.frames);
    this.playback.reset();
    return this.playback;
  }

  stopPlayback(): void {
    this.playback = null;
  }

  getPlaybackSource(): ReplayInputSource | null {
    return this.playback;
  }

  isPlaybackFinished(): boolean {
    return this.playback ? this.playback.isFinished() : false;
  }

  private buildHeader(world: World): ReplayHeader {
    const shipId = world.getPlayerShipId();
    const shipTransform = world.getTransform(shipId);
    const fallbackPosition = {
      x: world.width / CONFIG.world.centerDivisor,
      y: world.height / CONFIG.world.centerDivisor
    };
    const playerPosition = shipTransform ? shipTransform.position : fallbackPosition;
    const playerRotation = shipTransform ? shipTransform.rotation : CONFIG.core.zero;

    const noodles: ReplayNoodle[] = [];

    for (const [entity, noodle] of world.getNoodleEntries()) {
      const transform = world.getTransform(entity);
      const body = world.getRigidBody(entity);

      if (!transform || !body) {
        continue;
      }

      noodles.push({
        position: {
          x: transform.position.x,
          y: transform.position.y
        },
        velocity: {
          x: body.velocity.x,
          y: body.velocity.y
        },
        longAxis: noodle.longAxis,
        shortAxis: noodle.shortAxis,
        rotation: transform.rotation,
        angularVelocity: body.angularVelocity
      });
    }

    return {
      seed: world.rng.getState(),
      wave: world.wave,
      player: {
        position: {
          x: playerPosition.x,
          y: playerPosition.y
        },
        rotation: playerRotation
      },
      world: {
        width: world.width,
        height: world.height
      },
      noodles
    };
  }

  private toRecordedInput(snapshot: InputSnapshot): RecordedInput {
    return {
      left: snapshot.leftHeld,
      right: snapshot.rightHeld,
      thrust: snapshot.thrustHeld,
      fire: snapshot.fireHeld,
      startPressed: snapshot.startPressed,
      weaponCycle: snapshot.weaponCycle,
      pausePressed: snapshot.pausePressed
    };
  }
}

import { CONFIG } from "../content/config";
import type { InputSnapshot, InputSource } from "../systems/InputSystem";
import type { ReplayFrame } from "./ReplayTypes";

export class ReplayInputSource implements InputSource {
  private readonly frames: ReplayFrame[];
  private index = CONFIG.core.zero;

  constructor(frames: ReplayFrame[]) {
    this.frames = frames;
  }

  read(): InputSnapshot {
    if (this.index >= this.frames.length) {
      return this.emptySnapshot();
    }

    const frame = this.frames[this.index];
    this.index += CONFIG.core.one;

    return {
      leftHeld: frame.input.left,
      rightHeld: frame.input.right,
      thrustHeld: frame.input.thrust,
      fireHeld: frame.input.fire,
      startPressed: frame.input.startPressed,
      pausePressed: frame.input.pausePressed,
      weaponCycle: frame.input.weaponCycle,
      debugTogglePressed: false,
      hitboxTogglePressed: false,
      trailTogglePressed: false,
      replayTogglePressed: false,
      replayExportPressed: false,
      replayLoadPressed: false
    };
  }

  isFinished(): boolean {
    return this.index >= this.frames.length;
  }

  getTick(): number {
    return this.index;
  }

  getTotalTicks(): number {
    return this.frames.length;
  }

  reset(): void {
    this.index = CONFIG.core.zero;
  }

  private emptySnapshot(): InputSnapshot {
    return {
      leftHeld: false,
      rightHeld: false,
      thrustHeld: false,
      fireHeld: false,
      startPressed: false,
      pausePressed: false,
      weaponCycle: CONFIG.input.turnNone,
      debugTogglePressed: false,
      hitboxTogglePressed: false,
      trailTogglePressed: false,
      replayTogglePressed: false,
      replayExportPressed: false,
      replayLoadPressed: false
    };
  }
}

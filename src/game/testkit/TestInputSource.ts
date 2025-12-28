import { CONFIG } from "../content/config";
import type { InputSnapshot, InputSource } from "../systems/InputSystem";

export type InputScript = (tick: number) => InputSnapshot;

export class TestInputSource implements InputSource {
  private tick = CONFIG.core.zero;

  constructor(private readonly script: InputScript) {}

  read(): InputSnapshot {
    const snapshot = this.script(this.tick);
    this.tick += CONFIG.core.one;
    return snapshot;
  }

  getTick(): number {
    return this.tick;
  }

  reset(): void {
    this.tick = CONFIG.core.zero;
  }

  static emptySnapshot(): InputSnapshot {
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

import { CONFIG, type GameState } from "../content/config";
import type { World } from "../World";

export type InputSnapshot = {
  leftHeld: boolean;
  rightHeld: boolean;
  thrustHeld: boolean;
  fireHeld: boolean;
  startPressed: boolean;
  pausePressed: boolean;
  weaponCycle: number;
  debugTogglePressed: boolean;
  hitboxTogglePressed: boolean;
  trailTogglePressed: boolean;
  replayTogglePressed: boolean;
  replayExportPressed: boolean;
  replayLoadPressed: boolean;
};

export type InputFrame = {
  startRequested: boolean;
  fireRequested: boolean;
  weaponCycle: number;
  pauseToggled: boolean;
  replayToggleRequested: boolean;
  replayExportRequested: boolean;
  replayLoadRequested: boolean;
  snapshot: InputSnapshot;
};

export interface InputSource {
  read(): InputSnapshot;
  destroy?(): void;
}

export class LiveKeyboardInput implements InputSource {
  private readonly pressed = new Set<string>();
  private startPressed = false;
  private pausePressed = false;
  private debugTogglePressed = false;
  private hitboxTogglePressed = false;
  private trailTogglePressed = false;
  private replayTogglePressed = false;
  private replayExportPressed = false;
  private replayLoadPressed = false;
  private weaponCycle = CONFIG.input.turnNone;

  constructor(private readonly target: Window) {
    this.target.addEventListener("keydown", this.onKeyDown);
    this.target.addEventListener("keyup", this.onKeyUp);
    this.target.addEventListener("blur", this.onBlur);
  }

  read(): InputSnapshot {
    const snapshot: InputSnapshot = {
      leftHeld: this.pressed.has(CONFIG.input.leftKey),
      rightHeld: this.pressed.has(CONFIG.input.rightKey),
      thrustHeld: this.pressed.has(CONFIG.input.thrustKey),
      fireHeld: this.pressed.has(CONFIG.input.fireKey),
      startPressed: this.startPressed,
      pausePressed: this.pausePressed,
      weaponCycle: this.weaponCycle,
      debugTogglePressed: this.debugTogglePressed,
      hitboxTogglePressed: this.hitboxTogglePressed,
      trailTogglePressed: this.trailTogglePressed,
      replayTogglePressed: this.replayTogglePressed,
      replayExportPressed: this.replayExportPressed,
      replayLoadPressed: this.replayLoadPressed
    };

    this.startPressed = false;
    this.pausePressed = false;
    this.debugTogglePressed = false;
    this.hitboxTogglePressed = false;
    this.trailTogglePressed = false;
    this.replayTogglePressed = false;
    this.replayExportPressed = false;
    this.replayLoadPressed = false;
    this.weaponCycle = CONFIG.input.turnNone;

    return snapshot;
  }

  destroy(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === CONFIG.input.startKey && !event.repeat) {
      this.startPressed = true;
    }

    if (event.code === CONFIG.input.pauseKey && !event.repeat) {
      this.pausePressed = true;
    }

    if (event.code === CONFIG.input.debugToggleKey && !event.repeat) {
      this.debugTogglePressed = true;
    }

    if (event.code === CONFIG.input.hitboxToggleKey && !event.repeat) {
      this.hitboxTogglePressed = true;
    }

    if (event.code === CONFIG.input.trailToggleKey && !event.repeat) {
      this.trailTogglePressed = true;
    }

    if (event.code === CONFIG.input.weaponPrevKey && !event.repeat) {
      this.weaponCycle = CONFIG.input.turnLeft;
    }

    if (event.code === CONFIG.input.weaponNextKey && !event.repeat) {
      this.weaponCycle = CONFIG.input.turnRight;
    }

    if (event.code === CONFIG.input.replayToggleKey && !event.repeat) {
      this.replayTogglePressed = true;
    }

    if (event.code === CONFIG.input.replayExportKey && !event.repeat) {
      this.replayExportPressed = true;
    }

    if (event.code === CONFIG.input.replayLoadKey && !event.repeat) {
      this.replayLoadPressed = true;
    }

    this.pressed.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private onBlur = (): void => {
    this.pressed.clear();
    this.startPressed = false;
    this.pausePressed = false;
    this.weaponCycle = CONFIG.input.turnNone;
    this.debugTogglePressed = false;
    this.hitboxTogglePressed = false;
    this.trailTogglePressed = false;
    this.replayTogglePressed = false;
    this.replayExportPressed = false;
    this.replayLoadPressed = false;
  };
}

export class InputSystem {
  constructor(private source: InputSource) {}

  setSource(source: InputSource): void {
    this.source = source;
  }

  update(world: World, state: GameState, paused: boolean): InputFrame {
    const snapshot = this.source.read();
    const shipId = world.getPlayerShipId();
    const shipControls = world.getShipControl(shipId);

    if (shipControls) {
      shipControls.turn = CONFIG.input.turnNone;
      shipControls.thrusting = false;

      if (state === CONFIG.game.states.playing && !paused) {
        if (snapshot.leftHeld) {
          shipControls.turn = CONFIG.input.turnLeft;
        }

        if (snapshot.rightHeld) {
          shipControls.turn = CONFIG.input.turnRight;
        }

        if (snapshot.thrustHeld) {
          shipControls.thrusting = true;
        }
      }
    }

    if (snapshot.debugTogglePressed) {
      world.toggleDebug();
    }

    if (snapshot.hitboxTogglePressed) {
      world.toggleHitboxes();
    }

    if (snapshot.trailTogglePressed) {
      world.toggleProjectileTrails();
    }

    const startRequested = snapshot.startPressed;
    const fireRequested = snapshot.fireHeld && state === CONFIG.game.states.playing && !paused;
    const weaponCycle = snapshot.weaponCycle;
    const pauseToggled = snapshot.pausePressed;

    return {
      startRequested,
      fireRequested,
      weaponCycle,
      pauseToggled,
      replayToggleRequested: snapshot.replayTogglePressed,
      replayExportRequested: snapshot.replayExportPressed,
      replayLoadRequested: snapshot.replayLoadPressed,
      snapshot
    };
  }

  destroy(): void {
    this.source.destroy?.();
  }
}

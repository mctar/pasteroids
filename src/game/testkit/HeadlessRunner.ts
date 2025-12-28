import { CONFIG, type GameState } from "../content/config";
import { scanWorldForNaNs } from "./Invariants";
import { CollisionSystem } from "../systems/CollisionSystem";
import { InputSystem, type InputFrame, type InputSource } from "../systems/InputSystem";
import { PhysicsSystem } from "../systems/PhysicsSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { World, type WorldInitParams } from "../World";

export type HeadlessRunnerOptions = {
  width: number;
  height: number;
  init: WorldInitParams;
  inputSource: InputSource;
  spawnWaveCount?: number;
  invariantScanInterval?: number;
};

export class HeadlessRunner {
  private state: GameState = CONFIG.game.states.playing;
  private paused = false;
  private readonly input: InputSystem;
  private readonly weapons = new WeaponSystem();
  private readonly physics = new PhysicsSystem();
  private readonly collision = new CollisionSystem();
  private tick = CONFIG.core.zero;
  private readonly invariantScanInterval: number;

  constructor(private readonly options: HeadlessRunnerOptions) {
    this.world = new World(options.width, options.height, options.init);
    this.input = new InputSystem(options.inputSource);
    this.invariantScanInterval =
      options.invariantScanInterval ?? CONFIG.test.invariantScanInterval;

    if (options.spawnWaveCount !== undefined) {
      this.spawnWave(options.spawnWaveCount);
    }
  }

  private world: World;

  getWorld(): World {
    return this.world;
  }

  getState(): GameState {
    return this.state;
  }

  getTick(): number {
    return this.tick;
  }

  run(ticks: number): void {
    const dtSeconds = CONFIG.core.one / CONFIG.timing.fixedFps;

    for (let index = CONFIG.core.zero; index < ticks; index += CONFIG.core.one) {
      this.step(dtSeconds);
    }
  }

  step(dtSeconds: number): void {
    const input = this.input.update(this.world, this.state, this.paused);
    this.handleTick(input, dtSeconds);
    this.checkInvariants();
    this.tick += CONFIG.core.one;
  }

  private handleTick(input: InputFrame, dtSeconds: number): void {
    if (this.state === CONFIG.game.states.attract && input.startRequested) {
      this.state = CONFIG.game.states.playing;
    }

    if (this.state !== CONFIG.game.states.playing) {
      return;
    }

    if (input.pauseToggled) {
      this.paused = !this.paused;
    }

    if (this.paused) {
      return;
    }

    if (input.weaponCycle !== CONFIG.input.turnNone) {
      this.weapons.cycleWeapon(this.world, this.world.getPlayerShipId(), input.weaponCycle);
    }

    this.weapons.update(this.world, dtSeconds);

    if (input.fireRequested) {
      this.weapons.tryFire(this.world, this.world.getPlayerShipId());
    }

    this.physics.update(this.world, dtSeconds);
    this.collision.update(this.world);

    if (this.world.collisions.length > CONFIG.core.zero) {
      this.state = CONFIG.game.states.gameOver;
    }
  }

  private spawnWave(count: number): void {
    const shipId = this.world.getPlayerShipId();
    const ship = this.world.getShipControl(shipId);
    const safeRadius = CONFIG.wave.safeRadius + (ship ? ship.radius : CONFIG.core.zero);
    this.world.spawnWave(count, safeRadius);
  }

  private checkInvariants(): void {
    if (this.invariantScanInterval <= CONFIG.core.zero) {
      return;
    }

    if (this.tick % this.invariantScanInterval !== CONFIG.core.zero) {
      return;
    }

    const issues = scanWorldForNaNs(this.world);

    if (issues.length > CONFIG.core.zero) {
      const summary = issues.map((issue) => `${issue.label}=${issue.value}`).join(", ");
      throw new Error(`Invariant violation at tick ${this.tick}: ${summary}`);
    }
  }
}

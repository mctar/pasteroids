import { CONFIG, type GameState } from "./content/config";
import { World, type WorldInitParams } from "./World";
import { ReplayController } from "./replay/ReplayController";
import type { ReplayData } from "./replay/ReplayTypes";
import { CollisionSystem } from "./systems/CollisionSystem";
import { InputSystem, LiveKeyboardInput } from "./systems/InputSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { WeaponSystem } from "./systems/WeaponSystem";

export class Game {
  private state: GameState = CONFIG.game.states.attract;
  private world: World;
  private readonly input: InputSystem;
  private readonly liveInput: LiveKeyboardInput;
  private readonly physics = new PhysicsSystem();
  private readonly collision = new CollisionSystem();
  private readonly renderer: RenderSystem;
  private readonly weapons = new WeaponSystem();
  private readonly replay = new ReplayController();
  private lastTimeMs = CONFIG.core.zero;
  private accumulatorMs = CONFIG.core.zero;
  private paused = false;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const initialWidth = canvas.clientWidth || CONFIG.core.zero;
    const initialHeight = canvas.clientHeight || CONFIG.core.zero;

    const init = this.buildWorldInit(initialWidth, initialHeight);
    this.world = new World(initialWidth, initialHeight, init);
    this.liveInput = new LiveKeyboardInput(window);
    this.input = new InputSystem(this.liveInput);
    this.renderer = new RenderSystem(ctx);
    this.replay.startRecording(this.world);
  }

  start(): void {
    requestAnimationFrame(this.step);
  }

  resize(width: number, height: number): void {
    this.world.setSize(width, height);
  }

  private update(dtSeconds: number): void {
    const input = this.input.update(this.world, this.state, this.paused);

    if (this.replay.isRecording()) {
      this.replay.recordTick(input.snapshot);
    }

    if (input.replayToggleRequested) {
      this.replay.toggleRecording(this.world);
    }

    if (input.replayExportRequested) {
      this.exportReplay();
    }

    if (input.replayLoadRequested) {
      this.promptReplay();
    }

    if (this.state === CONFIG.game.states.attract && input.startRequested) {
      this.state = CONFIG.game.states.playing;
      this.paused = false;
      this.beginWaveIfNeeded();
    }

    if (this.state === CONFIG.game.states.gameOver && input.startRequested) {
      this.restart();
      return;
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
      return;
    }

    if (this.world.getNoodleCount() === CONFIG.core.zero) {
      this.advanceWave();
    }

    if (this.replay.isPlaying() && this.replay.isPlaybackFinished()) {
      this.replay.stopPlayback();
      this.input.setSource(this.liveInput);
    }
  }

  private render(): void {
    this.renderer.render(this.world, this.state, this.paused, this.replay.getStatus());
  }

  private restart(): void {
    const width = this.world.width;
    const height = this.world.height;

    const init = this.buildWorldInit(width, height);
    this.world = new World(width, height, init);
    this.state = CONFIG.game.states.playing;
    this.paused = false;
    this.beginWaveIfNeeded();
    if (this.replay.isRecording()) {
      this.replay.startRecording(this.world);
    }
  }

  private beginWaveIfNeeded(): void {
    if (this.world.getNoodleCount() > CONFIG.core.zero) {
      return;
    }

    this.spawnWave();
  }

  private advanceWave(): void {
    this.world.wave += CONFIG.core.one;
    this.spawnWave();
  }

  private spawnWave(): void {
    const shipId = this.world.getPlayerShipId();
    const ship = this.world.getShipControl(shipId);
    const safeRadius = CONFIG.wave.safeRadius + (ship ? ship.radius : CONFIG.core.zero);
    const waveIndex = Math.max(CONFIG.core.zero, this.world.wave - CONFIG.core.one);
    const targetCount = CONFIG.wave.baseNoodles + waveIndex * CONFIG.wave.increment;
    const cappedCount = Math.min(targetCount, CONFIG.world.maxNoodles);

    this.world.spawnWave(cappedCount, safeRadius);
  }

  private exportReplay(): void {
    const data = this.replay.exportReplay();

    if (!data) {
      return;
    }

    const json = JSON.stringify(data);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).catch(() => {
        console.log(json);
      });
      return;
    }

    console.log(json);
  }

  private promptReplay(): void {
    const json = window.prompt(CONFIG.replay.promptTitle);

    if (!json) {
      return;
    }

    const data = this.replay.loadReplay(json);

    if (!data) {
      return;
    }

    this.startPlayback(data);
  }

  private startPlayback(data: ReplayData): void {
    const header = data.header;

    const init: WorldInitParams = {
      seed: header.seed,
      startingWave: header.wave,
      shipInitialTransform: {
        position: { x: header.player.position.x, y: header.player.position.y },
        rotation: header.player.rotation
      },
      initialNoodles: header.noodles.map((noodle) => ({
        position: { x: noodle.position.x, y: noodle.position.y },
        velocity: { x: noodle.velocity.x, y: noodle.velocity.y },
        longAxis: noodle.longAxis,
        shortAxis: noodle.shortAxis,
        rotation: noodle.rotation,
        angularVelocity: noodle.angularVelocity
      }))
    };
    this.world = new World(header.world.width, header.world.height, init);
    this.state = CONFIG.game.states.playing;
    this.paused = false;

    const replaySource = this.replay.startPlayback(data);
    this.input.setSource(replaySource);
  }

  private buildWorldInit(width: number, height: number): WorldInitParams {
    const seed = CONFIG.rng.useSeed ? CONFIG.rng.seed : undefined;
    const center = {
      x: width / CONFIG.world.centerDivisor,
      y: height / CONFIG.world.centerDivisor
    };

    return {
      seed,
      startingWave: CONFIG.game.startingWave,
      shipInitialTransform: {
        position: center,
        rotation: CONFIG.core.zero
      }
    };
  }

  private updateDebug(frameMs: number, fixedStepMs: number, subSteps: number): void {
    const debug = this.world.debug;

    debug.frameMs = frameMs;
    debug.accumulatorMs = this.accumulatorMs;
    debug.fixedStepMs = fixedStepMs;
    debug.subSteps = subSteps;

    if (frameMs > CONFIG.core.zero) {
      const instantFps = CONFIG.timing.msPerSecond / frameMs;
      const smoothing = CONFIG.debug.fpsSmoothing;
      debug.fps =
        debug.fps === CONFIG.core.zero
          ? instantFps
          : debug.fps * smoothing + instantFps * (CONFIG.core.one - smoothing);
    }
  }

  private step = (timeMs: number): void => {
    if (this.lastTimeMs === CONFIG.core.zero) {
      this.lastTimeMs = timeMs;
    }

    let frameMs = timeMs - this.lastTimeMs;
    this.lastTimeMs = timeMs;

    if (frameMs > CONFIG.timing.maxFrameMs) {
      frameMs = CONFIG.timing.maxFrameMs;
    }

    this.accumulatorMs += frameMs;

    const fixedStepMs = CONFIG.timing.msPerSecond / CONFIG.timing.fixedFps;
    const fixedStepSeconds = fixedStepMs / CONFIG.timing.msPerSecond;
    let subSteps = CONFIG.core.zero;

    while (this.accumulatorMs >= fixedStepMs && subSteps < CONFIG.timing.maxSubSteps) {
      this.update(fixedStepSeconds);
      this.accumulatorMs -= fixedStepMs;
      subSteps += CONFIG.core.one;
    }

    this.updateDebug(frameMs, fixedStepMs, subSteps);
    this.render();
    requestAnimationFrame(this.step);
  };
}

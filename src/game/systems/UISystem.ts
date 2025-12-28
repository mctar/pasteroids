import { CONFIG, type GameState } from "../content/config";
import type { ReplayStatus } from "../replay/ReplayTypes";
import type { WeaponState, World } from "../World";

export class UISystem {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(world: World, state: GameState, paused: boolean, replayStatus: ReplayStatus): void {
    this.drawHud(world, state, paused, replayStatus);

    if (world.debug.enabled) {
      this.drawDebugOverlay(world);
    }
  }

  private drawHud(
    world: World,
    state: GameState,
    paused: boolean,
    replayStatus: ReplayStatus
  ): void {
    const ctx = this.ctx;

    ctx.fillStyle = CONFIG.canvas.textColor;
    ctx.font = `${CONFIG.render.hudFontSize}px ${CONFIG.render.fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const shipId = world.getPlayerShipId();
    const weaponState = world.getWeaponState(shipId);
    const weaponId = weaponState ? weaponState.weaponId : CONFIG.hud.cooldownUnknown;
    const weaponName = this.resolveWeaponName(weaponId);
    const cooldownText = this.resolveCooldownText(weaponState);

    const lines = [
      `${CONFIG.hud.scoreLabel}: ${world.score}`,
      `${CONFIG.hud.waveLabel}: ${world.wave}`,
      `${CONFIG.hud.weaponLabel}: ${weaponName}`,
      `${CONFIG.hud.cooldownLabel}: ${cooldownText}`,
      `${CONFIG.hud.replayLabel}: ${this.resolveReplayText(replayStatus)}`,
      `${CONFIG.hud.statusLabel}: ${world.getNoodleCount()}`
    ];

    let currentY = CONFIG.render.lineWidth;
    for (const line of lines) {
      ctx.fillText(line, CONFIG.render.lineWidth, currentY);
      currentY += CONFIG.render.hudLineHeight;
    }

    if (state === CONFIG.game.states.attract) {
      this.drawCenteredHint(world, CONFIG.hud.startHint);
    } else if (state === CONFIG.game.states.gameOver) {
      this.drawCenteredHint(world, CONFIG.hud.restartHint);
    } else if (paused) {
      this.drawCenteredHint(world, CONFIG.hud.pauseHint);
    }
  }

  private drawDebugOverlay(world: World): void {
    const ctx = this.ctx;
    const precision = CONFIG.debug.precision;
    const debug = world.debug;
    const lines = [
      `${CONFIG.debug.fpsLabel}: ${debug.fps.toFixed(precision)}`,
      `${CONFIG.debug.frameLabel}: ${debug.frameMs.toFixed(precision)}${CONFIG.debug.msSuffix}`,
      `${CONFIG.debug.accumulatorLabel}: ${debug.accumulatorMs.toFixed(precision)}${CONFIG.debug.msSuffix}` +
        ` ${CONFIG.debug.stepLabel}: ${debug.fixedStepMs.toFixed(precision)}${CONFIG.debug.msSuffix}` +
        ` ${CONFIG.debug.subStepsLabel}: ${debug.subSteps}`,
      `${CONFIG.debug.activeLabel}: ${CONFIG.debug.shipLabel} ${world.getShipCount()}` +
        ` ${CONFIG.debug.noodleLabel} ${world.getNoodleCount()}` +
        ` ${CONFIG.debug.projectileLabel} ${world.getProjectileCount()}` +
        ` ${CONFIG.debug.particleLabel} ${world.getParticleCount()}`,
      `${CONFIG.debug.hitboxLabel}: ${debug.showHitboxes ? CONFIG.debug.onLabel : CONFIG.debug.offLabel}`
    ];

    ctx.fillStyle = CONFIG.canvas.textColor;
    ctx.font = `${CONFIG.debug.overlayFontSize}px ${CONFIG.render.fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const startX = CONFIG.debug.overlayPadding;
    let currentY = CONFIG.debug.overlayPadding;

    for (const line of lines) {
      ctx.fillText(line, startX, currentY);
      currentY += CONFIG.debug.overlayLineHeight;
    }
  }

  private resolveReplayText(replayStatus: ReplayStatus): string {
    if (replayStatus.mode === "playback") {
      return `${CONFIG.hud.replayPlayLabel} ${replayStatus.tick}${CONFIG.hud.replayTickSeparator}${replayStatus.totalTicks}`;
    }

    if (replayStatus.mode === "recording") {
      return CONFIG.hud.replayRecLabel;
    }

    return CONFIG.hud.replayOffLabel;
  }

  private drawCenteredHint(world: World, text: string): void {
    const ctx = this.ctx;

    ctx.font = `${CONFIG.render.hintFontSize}px ${CONFIG.render.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = CONFIG.canvas.accentColor;

    const centerX = world.width / CONFIG.world.centerDivisor;
    const centerY = world.height / CONFIG.world.centerDivisor;

    ctx.fillText(text, centerX, centerY);
  }

  private resolveWeaponName(weaponId: string): string {
    if (weaponId === CONFIG.weapon.straightShot.id) {
      return CONFIG.weapon.straightShot.name;
    }

    if (weaponId === CONFIG.weapon.parabolic.id) {
      return CONFIG.weapon.parabolic.name;
    }

    if (weaponId === CONFIG.weapon.blast.id) {
      return CONFIG.weapon.blast.name;
    }

    if (weaponId === CONFIG.weapon.rearCannons.id) {
      return CONFIG.weapon.rearCannons.name;
    }

    return weaponId;
  }

  private resolveCooldownText(weaponState: WeaponState | undefined): string {
    if (!weaponState) {
      return CONFIG.hud.cooldownUnknown;
    }

    if (weaponState.cooldownRemaining <= CONFIG.core.zero) {
      return CONFIG.hud.cooldownReady;
    }

    return `${weaponState.cooldownRemaining.toFixed(CONFIG.hud.cooldownPrecision)}${CONFIG.hud.secondsSuffix}`;
  }
}

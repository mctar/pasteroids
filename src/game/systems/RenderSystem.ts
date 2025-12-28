import { CONFIG, type GameState } from "../content/config";
import { getCapsuleEndpoints } from "../math/geometry";
import { clamp } from "../math/scalars";
import type { ReplayStatus } from "../replay/ReplayTypes";
import type { World } from "../World";
import { UISystem } from "./UISystem";

export class RenderSystem {
  private readonly ui: UISystem;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.ui = new UISystem(ctx);
  }

  render(world: World, state: GameState, paused: boolean, replayStatus: ReplayStatus): void {
    this.clear(world);
    this.drawNoodles(world);
    this.drawShips(world);
    if (world.debug.enabled) {
      this.drawFuseRings(world);
    }
    if (world.debug.showProjectileTrails) {
      this.drawProjectileTrails(world);
    }
    this.drawExplosions(world);
    this.drawProjectiles(world);

    if (world.debug.showHitboxes) {
      this.drawHitboxes(world);
    }

    this.ui.render(world, state, paused, replayStatus);
  }

  private clear(world: World): void {
    this.ctx.fillStyle = CONFIG.canvas.background;
    this.ctx.fillRect(CONFIG.core.zero, CONFIG.core.zero, world.width, world.height);
  }

  private drawShips(world: World): void {
    const ctx = this.ctx;
    const shipScale = CONFIG.render.shipScale;

    for (const [entity, ship] of world.getShipEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      ctx.save();
      ctx.translate(transform.position.x, transform.position.y);
      ctx.rotate(transform.rotation);
      ctx.strokeStyle = CONFIG.ship.color;
      ctx.lineWidth = CONFIG.render.lineWidth;

      const nose = ship.radius * CONFIG.ship.noseScale * shipScale;
      const wing = ship.radius * CONFIG.ship.wingScale * shipScale;
      const tail = ship.radius * CONFIG.ship.tailScale * shipScale;

      ctx.beginPath();
      ctx.moveTo(nose, CONFIG.core.zero);
      ctx.lineTo(CONFIG.core.negativeOne * tail, wing);
      ctx.lineTo(CONFIG.core.negativeOne * tail, CONFIG.core.negativeOne * wing);
      ctx.closePath();
      ctx.stroke();

      if (ship.thrusting) {
        const flame = ship.radius * CONFIG.ship.flameScale * shipScale;

        ctx.beginPath();
        ctx.moveTo(CONFIG.core.negativeOne * tail, CONFIG.core.zero);
        ctx.lineTo(CONFIG.core.negativeOne * (tail + flame), CONFIG.core.zero);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawNoodles(world: World): void {
    const ctx = this.ctx;
    const noodleScale = CONFIG.render.noodleScale;

    ctx.strokeStyle = CONFIG.noodle.color;
    ctx.lineWidth = CONFIG.render.lineWidth;

    for (const [entity, noodle] of world.getNoodleEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      ctx.save();
      ctx.translate(transform.position.x, transform.position.y);
      ctx.rotate(transform.rotation);

      const axisX = noodle.longAxis * noodleScale;
      const axisY = noodle.shortAxis * noodleScale;

      ctx.beginPath();
      ctx.ellipse(
        CONFIG.core.zero,
        CONFIG.core.zero,
        axisX,
        axisY,
        CONFIG.core.zero,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();

      const halfLongAxis = noodle.longAxis * CONFIG.core.half;

      ctx.beginPath();
      ctx.moveTo(CONFIG.core.zero, CONFIG.core.negativeOne * halfLongAxis);
      ctx.lineTo(CONFIG.core.zero, halfLongAxis);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawFuseRings(world: World): void {
    const ctx = this.ctx;

    ctx.strokeStyle = CONFIG.fuse.color;
    ctx.lineWidth = CONFIG.fuse.lineWidth;

    for (const [entity, noodle] of world.getNoodleEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      const fuseRadius = CONFIG.fuse.scale * noodle.longAxis;

      ctx.beginPath();
      ctx.arc(
        transform.position.x,
        transform.position.y,
        fuseRadius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();
    }
  }

  private drawProjectiles(world: World): void {
    const ctx = this.ctx;

    ctx.fillStyle = CONFIG.projectile.color;

    for (const [entity, projectile] of world.getProjectileEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(
        transform.position.x,
        transform.position.y,
        projectile.radius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.fill();
    }
  }

  private drawExplosions(world: World): void {
    const ctx = this.ctx;

    ctx.strokeStyle = CONFIG.explosion.color;
    ctx.lineWidth = CONFIG.explosion.lineWidth;

    for (const explosion of world.explosions) {
      const progress = clamp(
        explosion.ageSeconds / explosion.durationSeconds,
        CONFIG.core.zero,
        CONFIG.core.one
      );
      const radius = explosion.radius * progress;

      ctx.beginPath();
      ctx.arc(explosion.position.x, explosion.position.y, radius, CONFIG.core.zero, CONFIG.math.tau);
      ctx.stroke();
    }
  }

  private drawProjectileTrails(world: World): void {
    const ctx = this.ctx;

    ctx.strokeStyle = CONFIG.debug.trailColor;
    ctx.lineWidth = CONFIG.debug.trailLineWidth;

    for (const [, projectile] of world.getProjectileEntries()) {
      const trail = projectile.trail;

      if (trail.length < CONFIG.core.two) {
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(trail[CONFIG.core.zero].x, trail[CONFIG.core.zero].y);

      for (let index = CONFIG.core.one; index < trail.length; index += CONFIG.core.one) {
        ctx.lineTo(trail[index].x, trail[index].y);
      }

      ctx.stroke();
    }
  }

  private drawHitboxes(world: World): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = CONFIG.debug.hitboxColor;
    ctx.lineWidth = CONFIG.debug.hitboxLineWidth;

    for (const [entity, ship] of world.getShipEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(
        transform.position.x,
        transform.position.y,
        ship.radius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();
    }

    for (const [entity, noodle] of world.getNoodleEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      const capsule = getCapsuleEndpoints(
        transform.position,
        transform.rotation,
        noodle.longAxis,
        noodle.shortAxis
      );

      ctx.beginPath();
      ctx.moveTo(capsule.start.x, capsule.start.y);
      ctx.lineTo(capsule.end.x, capsule.end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        capsule.start.x,
        capsule.start.y,
        capsule.radius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        capsule.end.x,
        capsule.end.y,
        capsule.radius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();
    }

    for (const [entity, projectile] of world.getProjectileEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(
        transform.position.x,
        transform.position.y,
        projectile.radius,
        CONFIG.core.zero,
        CONFIG.math.tau
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}

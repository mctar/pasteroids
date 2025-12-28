import { CONFIG } from "../content/config";
import type { Projectile, RigidBody, World } from "../World";
import { WrapSystem } from "./WrapSystem";

export class PhysicsSystem {
  private readonly wrap = new WrapSystem();

  update(world: World, dtSeconds: number): void {
    this.applyImpulses(world);
    this.updateShips(world, dtSeconds);
    this.updateNoodles(world, dtSeconds);
    this.updateProjectiles(world, dtSeconds);
    this.integrate(world, dtSeconds);
    this.updateExplosions(world, dtSeconds);
  }

  private updateShips(world: World, dtSeconds: number): void {
    for (const [entity, ship] of world.getShipEntries()) {
      const transform = world.getTransform(entity);
      const body = world.getRigidBody(entity);

      if (!transform || !body) {
        continue;
      }

      transform.rotation += ship.turn * CONFIG.ship.turnSpeed * dtSeconds;

      if (ship.thrusting) {
        body.velocity.x += Math.cos(transform.rotation) * CONFIG.ship.thrustAccel * dtSeconds;
        body.velocity.y += Math.sin(transform.rotation) * CONFIG.ship.thrustAccel * dtSeconds;
      }

      body.velocity.x *= CONFIG.ship.damping;
      body.velocity.y *= CONFIG.ship.damping;

      this.clampSpeed(body, CONFIG.ship.maxSpeed);
    }
  }

  private updateNoodles(world: World, dtSeconds: number): void {
    for (const [entity] of world.getNoodleEntries()) {
      const transform = world.getTransform(entity);
      const body = world.getRigidBody(entity);

      if (!transform || !body) {
        continue;
      }

      transform.rotation += body.angularVelocity * dtSeconds;
      body.velocity.x *= CONFIG.noodle.damping;
      body.velocity.y *= CONFIG.noodle.damping;
    }
  }

  private updateProjectiles(world: World, dtSeconds: number): void {
    for (const [entity, projectile] of world.getProjectileEntries()) {
      const body = world.getRigidBody(entity);
      const lifetime = world.getLifetime(entity);

      if (!body || !lifetime) {
        continue;
      }

      body.velocity.x += projectile.accel.x * dtSeconds;
      body.velocity.y += projectile.accel.y * dtSeconds;

      lifetime.remainingSeconds -= dtSeconds;
      if (lifetime.remainingSeconds <= CONFIG.core.zero) {
        world.markProjectileExpired(entity);
      }
    }
  }

  private integrate(world: World, dtSeconds: number): void {
    for (const [entity, body] of world.getRigidBodyEntries()) {
      const transform = world.getTransform(entity);

      if (!transform) {
        continue;
      }

      transform.position.x += body.velocity.x * dtSeconds;
      transform.position.y += body.velocity.y * dtSeconds;

      transform.position.x = this.wrap.wrapValue(transform.position.x, world.width);
      transform.position.y = this.wrap.wrapValue(transform.position.y, world.height);

      const projectile = world.getProjectile(entity);
      if (projectile) {
        this.recordTrail(projectile, transform.position);
      }
    }
  }

  private clampSpeed(body: RigidBody, maxSpeed: number): void {
    const speed = Math.hypot(body.velocity.x, body.velocity.y);

    if (speed > maxSpeed && speed > CONFIG.core.zero) {
      const scale = maxSpeed / speed;
      body.velocity.x *= scale;
      body.velocity.y *= scale;
    }
  }

  private recordTrail(projectile: Projectile, position: { x: number; y: number }): void {
    const maxLength = CONFIG.debug.projectileTrailLength;

    if (maxLength <= CONFIG.core.zero) {
      return;
    }

    projectile.trail.push({
      x: position.x,
      y: position.y
    });

    if (projectile.trail.length > maxLength) {
      projectile.trail.splice(CONFIG.core.zero, projectile.trail.length - maxLength);
    }
  }

  private applyImpulses(world: World): void {
    const impulses = world.consumeImpulses();

    for (const [entity, impulse] of impulses) {
      const body = world.getRigidBody(entity);

      if (!body) {
        continue;
      }

      body.velocity.x += impulse.x;
      body.velocity.y += impulse.y;
    }
  }

  private updateExplosions(world: World, dtSeconds: number): void {
    const remaining: typeof world.explosions = [];

    for (const explosion of world.explosions) {
      explosion.ageSeconds += dtSeconds;

      if (explosion.ageSeconds <= explosion.durationSeconds) {
        remaining.push(explosion);
      }
    }

    world.explosions = remaining;
  }
}

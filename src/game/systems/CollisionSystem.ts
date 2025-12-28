import { CONFIG } from "../content/config";
import {
  circleCapsuleCollision,
  getCapsuleEndpoints,
  pointToSegmentDistanceSquared
} from "../math/geometry";
import { clamp } from "../math/scalars";
import { dotVec2, rotateVec2, scaleVec2, subVec2, vec2 } from "../math/vec2";
import type { Entity, ExplosionEvent, ExplosionSpec, Noodle, Projectile, Transform, World } from "../World";

export class CollisionSystem {
  update(world: World): void {
    world.clearCollisions();
    this.checkShipNoodles(world);
    const noodlesToRemove = new Set<Entity>();
    const projectilesToRemove = new Set<Entity>();

    this.checkProjectileNoodles(world, projectilesToRemove, noodlesToRemove);
    this.handleExpiredProjectiles(world, projectilesToRemove, noodlesToRemove);

    for (const entity of projectilesToRemove) {
      world.destroyEntity(entity);
    }

    for (const entity of noodlesToRemove) {
      world.destroyEntity(entity);
    }
  }

  private checkShipNoodles(world: World): void {
    for (const [shipEntity, ship] of world.getShipEntries()) {
      const shipTransform = world.getTransform(shipEntity);

      if (!shipTransform) {
        continue;
      }

      for (const [noodleEntity, noodle] of world.getNoodleEntries()) {
        const noodleTransform = world.getTransform(noodleEntity);

        if (!noodleTransform) {
          continue;
        }

        const result = circleCapsuleCollision(
          shipTransform.position,
          ship.radius,
          noodleTransform.position,
          noodleTransform.rotation,
          noodle.longAxis,
          noodle.shortAxis
        );

        if (result.hit) {
          world.addCollision(shipEntity, noodleEntity);
        }
      }
    }
  }

  private checkProjectileNoodles(
    world: World,
    projectilesToRemove: Set<Entity>,
    noodlesToRemove: Set<Entity>
  ): void {
    for (const [projectileEntity, projectile] of world.getProjectileEntries()) {
      if (projectilesToRemove.has(projectileEntity)) {
        continue;
      }

      const projectileTransform = world.getTransform(projectileEntity);

      if (!projectileTransform) {
        continue;
      }

      for (const [noodleEntity, noodle] of world.getNoodleEntries()) {
        if (noodlesToRemove.has(noodleEntity)) {
          continue;
        }

        const noodleTransform = world.getTransform(noodleEntity);

        if (!noodleTransform) {
          continue;
        }

        const fuseHit = this.checkProximityFuse(
          projectileTransform.position,
          projectile,
          noodle,
          noodleTransform
        );

        const impactHit = circleCapsuleCollision(
          projectileTransform.position,
          projectile.radius,
          noodleTransform.position,
          noodleTransform.rotation,
          noodle.longAxis,
          noodle.shortAxis
        ).hit;

        if (!fuseHit && !impactHit) {
          continue;
        }

        projectilesToRemove.add(projectileEntity);

        if (projectile.explosion) {
          this.detonateProjectile(
            world,
            projectileTransform,
            projectile.explosion,
            noodlesToRemove
          );
        } else {
          this.applyDamageToNoodle(
            world,
            noodleEntity,
            noodle,
            noodleTransform,
            projectile.damage,
            noodlesToRemove
          );
        }

        break;
      }
    }
  }

  private handleExpiredProjectiles(
    world: World,
    projectilesToRemove: Set<Entity>,
    noodlesToRemove: Set<Entity>
  ): void {
    const expired = world.consumeExpiredProjectiles();

    for (const entity of expired) {
      if (projectilesToRemove.has(entity)) {
        continue;
      }

      const projectile = world.getProjectile(entity);
      const transform = world.getTransform(entity);

      if (!projectile || !transform) {
        projectilesToRemove.add(entity);
        continue;
      }

      if (projectile.explosion) {
        this.detonateProjectile(world, transform, projectile.explosion, noodlesToRemove);
      }

      projectilesToRemove.add(entity);
    }
  }

  private detonateProjectile(
    world: World,
    transform: Transform,
    explosion: ExplosionSpec,
    noodlesToRemove: Set<Entity>
  ): void {
    const event: ExplosionEvent = {
      position: {
        x: transform.position.x,
        y: transform.position.y
      },
      radius: explosion.radius,
      damage: explosion.damage,
      impulseStrength: explosion.impulseStrength,
      durationSeconds: explosion.durationSeconds,
      ageSeconds: CONFIG.core.zero
    };

    world.addExplosion(event);
    this.applyExplosion(world, event, noodlesToRemove);
  }

  private applyExplosion(
    world: World,
    explosion: ExplosionEvent,
    noodlesToRemove: Set<Entity>
  ): void {
    for (const [noodleEntity, noodle] of world.getNoodleEntries()) {
      if (noodlesToRemove.has(noodleEntity)) {
        continue;
      }

      const noodleTransform = world.getTransform(noodleEntity);

      if (!noodleTransform) {
        continue;
      }

      const capsule = getCapsuleEndpoints(
        noodleTransform.position,
        noodleTransform.rotation,
        noodle.longAxis,
        noodle.shortAxis
      );

      const distanceSq = pointToSegmentDistanceSquared(explosion.position, capsule.start, capsule.end);
      const maxDistance = explosion.radius + capsule.radius;
      const maxDistanceSq = maxDistance * maxDistance;

      if (distanceSq > maxDistanceSq) {
        continue;
      }

      const distance = Math.sqrt(distanceSq);
      const falloff = CONFIG.core.one - clamp(distance / maxDistance, CONFIG.core.zero, CONFIG.core.one);
      const impulseMag = explosion.impulseStrength * falloff;
      const delta = subVec2(noodleTransform.position, explosion.position);
      const deltaSq = delta.x * delta.x + delta.y * delta.y;
      const direction =
        deltaSq <= CONFIG.math.epsilon * CONFIG.math.epsilon ? capsule.axis : scaleVec2(delta, CONFIG.core.one / Math.sqrt(deltaSq));

      world.queueImpulse(noodleEntity, scaleVec2(direction, impulseMag));
      this.applyDamageToNoodle(world, noodleEntity, noodle, noodleTransform, explosion.damage, noodlesToRemove);
    }
  }

  private applyDamageToNoodle(
    world: World,
    noodleEntity: Entity,
    noodle: Noodle,
    transform: Transform,
    damage: number,
    noodlesToRemove: Set<Entity>
  ): void {
    if (damage <= CONFIG.core.zero) {
      return;
    }

    noodle.hp -= damage;

    if (noodle.hp <= CONFIG.core.zero) {
      noodlesToRemove.add(noodleEntity);
      world.score += noodle.scoreValue;
      this.splitNoodle(world, noodleEntity, noodle, transform);
    }
  }

  private checkProximityFuse(
    projectilePosition: Transform["position"],
    projectile: Projectile,
    noodle: Noodle,
    noodleTransform: Transform
  ): boolean {
    if (!projectile.proximityFuseEnabled) {
      return false;
    }

    const fuseRadius = CONFIG.fuse.scale * noodle.longAxis;
    const fuseRange = fuseRadius + projectile.radius;
    const delta = subVec2(projectilePosition, noodleTransform.position);
    const distanceSq = dotVec2(delta, delta);
    const fuseRangeSq = fuseRange * fuseRange;

    return distanceSq <= fuseRangeSq;
  }

  private splitNoodle(
    world: World,
    entity: Entity,
    noodle: Noodle,
    transform: Transform
  ): void {
    if (noodle.longAxis <= CONFIG.noodle.splitThreshold) {
      return;
    }

    const body = world.getRigidBody(entity);

    if (!body) {
      return;
    }

    const childLongAxis = noodle.longAxis * CONFIG.noodle.splitScale;
    const childShortAxis = noodle.shortAxis * CONFIG.noodle.splitScale;
    let availableSlots = CONFIG.world.maxNoodles - world.getNoodleCount();

    if (availableSlots <= CONFIG.core.zero) {
      return;
    }

    for (
      let index = CONFIG.core.zero;
      index < CONFIG.noodle.splitCount && availableSlots > CONFIG.core.zero;
      index += CONFIG.core.one
    ) {
      const impulseAngle = world.rng.range(CONFIG.core.zero, CONFIG.math.tau);
      const impulseMag = world.rng.range(CONFIG.noodle.splitImpulseMin, CONFIG.noodle.splitImpulseMax);
      const impulse = scaleVec2(rotateVec2(vec2(CONFIG.core.one, CONFIG.core.zero), impulseAngle), impulseMag);
      const velocity = {
        x: body.velocity.x + impulse.x,
        y: body.velocity.y + impulse.y
      };

      const spawned = world.spawnNoodle(
        { x: transform.position.x, y: transform.position.y },
        velocity,
        childLongAxis,
        childShortAxis,
        transform.rotation,
        body.angularVelocity
      );

      if (!spawned) {
        return;
      }

      availableSlots -= CONFIG.core.one;
    }
  }
}

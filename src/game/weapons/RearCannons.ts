import { CONFIG } from "../content/config";
import { addVec2, rotateVec2, scaleVec2, vec2 } from "../math/vec2";
import type { Entity, World } from "../World";
import type { Weapon } from "./Weapon";

export class RearCannonsWeapon implements Weapon {
  id = CONFIG.weapon.rearCannons.id;
  name = CONFIG.weapon.rearCannons.name;
  cooldownSeconds = CONFIG.weapon.rearCannons.cooldownSeconds;

  update(dtSeconds: number): void {
    void dtSeconds;
  }

  tryFire(world: World, shipEntity: Entity): boolean {
    const transform = world.getTransform(shipEntity);
    const body = world.getRigidBody(shipEntity);

    if (!transform || !body) {
      return false;
    }

    const hardpoints = CONFIG.weapon.rearCannons.hardpoints;
    const needed = hardpoints.length;

    if (needed <= CONFIG.core.zero) {
      return false;
    }

    if (world.getProjectileCount() + needed > CONFIG.world.maxProjectiles) {
      return false;
    }

    const forward = vec2(Math.cos(transform.rotation), Math.sin(transform.rotation));
    const backward = scaleVec2(forward, CONFIG.core.negativeOne);

    for (const hardpoint of hardpoints) {
      const local = vec2(hardpoint.x, hardpoint.y);
      const rotatedOffset = rotateVec2(local, transform.rotation);
      const spawnPos = addVec2(transform.position, rotatedOffset);
      const projectileVelocity = addVec2(
        scaleVec2(backward, CONFIG.weapon.rearCannons.projectileSpeed),
        body.velocity
      );

      const projectile = world.spawnProjectile(
        spawnPos,
        projectileVelocity,
        CONFIG.weapon.rearCannons.lifetimeSeconds
      );

      if (!projectile) {
        return false;
      }
    }

    return true;
  }
}

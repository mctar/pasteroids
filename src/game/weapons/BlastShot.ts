import { CONFIG } from "../content/config";
import { addVec2, scaleVec2, vec2 } from "../math/vec2";
import type { Entity, World } from "../World";
import type { Weapon } from "./Weapon";

export class BlastShotWeapon implements Weapon {
  id = CONFIG.weapon.blast.id;
  name = CONFIG.weapon.blast.name;
  cooldownSeconds = CONFIG.weapon.blast.cooldownSeconds;

  update(dtSeconds: number): void {
    void dtSeconds;
  }

  tryFire(world: World, shipEntity: Entity): boolean {
    const transform = world.getTransform(shipEntity);
    const body = world.getRigidBody(shipEntity);
    const ship = world.getShipControl(shipEntity);

    if (!transform || !body || !ship) {
      return false;
    }

    const forward = vec2(Math.cos(transform.rotation), Math.sin(transform.rotation));
    const noseOffset = ship.radius * CONFIG.ship.noseScale * CONFIG.weapon.blast.spawnOffsetScale;
    const spawnOffset = scaleVec2(forward, noseOffset);
    const spawnPos = addVec2(transform.position, spawnOffset);
    const projectileVelocity = addVec2(
      scaleVec2(forward, CONFIG.weapon.blast.projectileSpeed),
      body.velocity
    );

    const projectile = world.spawnProjectile(
      spawnPos,
      projectileVelocity,
      CONFIG.weapon.blast.lifetimeSeconds,
      {
        radius: CONFIG.weapon.blast.projectileRadius,
        damage: CONFIG.weapon.blast.projectileDamage,
        proximityFuseEnabled: true,
        explosion: {
          radius: CONFIG.weapon.blast.explosionRadius,
          damage: CONFIG.weapon.blast.explosionDamage,
          impulseStrength: CONFIG.weapon.blast.explosionImpulse,
          durationSeconds: CONFIG.weapon.blast.explosionDurationSeconds
        }
      }
    );

    return projectile !== undefined;
  }
}

import { CONFIG } from "../content/config";
import { addVec2, scaleVec2, vec2 } from "../math/vec2";
import type { Entity, World } from "../World";
import type { Weapon } from "./Weapon";

export class ParabolicShotWeapon implements Weapon {
  id = CONFIG.weapon.parabolic.id;
  name = CONFIG.weapon.parabolic.name;
  cooldownSeconds = CONFIG.weapon.parabolic.cooldownSeconds;

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
    const noseOffset = ship.radius * CONFIG.ship.noseScale * CONFIG.weapon.parabolic.spawnOffsetScale;
    const spawnOffset = scaleVec2(forward, noseOffset);
    const spawnPos = addVec2(transform.position, spawnOffset);
    const projectileVelocity = addVec2(
      scaleVec2(forward, CONFIG.weapon.parabolic.projectileSpeed),
      body.velocity
    );

    const projectile = world.spawnProjectile(spawnPos, projectileVelocity, CONFIG.projectile.lifetimeSeconds, {
      accel: {
        x: CONFIG.core.zero,
        y: CONFIG.weapon.parabolic.gravity
      }
    });

    return projectile !== undefined;
  }
}

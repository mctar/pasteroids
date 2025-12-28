import { CONFIG } from "../content/config";
import { addVec2, scaleVec2, vec2 } from "../math/vec2";
import type { Entity, World } from "../World";
import type { Weapon } from "./Weapon";

export class StraightShotWeapon implements Weapon {
  id = CONFIG.weapon.straightShot.id;
  name = CONFIG.weapon.straightShot.name;
  cooldownSeconds = CONFIG.weapon.straightShot.cooldownSeconds;

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
    const noseOffset = ship.radius * CONFIG.ship.noseScale * CONFIG.weapon.straightShot.spawnOffsetScale;
    const spawnOffset = scaleVec2(forward, noseOffset);
    const spawnPos = addVec2(transform.position, spawnOffset);
    const projectileVelocity = addVec2(
      scaleVec2(forward, CONFIG.weapon.straightShot.projectileSpeed),
      body.velocity
    );

    return (
      world.spawnProjectile(spawnPos, projectileVelocity, CONFIG.projectile.lifetimeSeconds) !==
      undefined
    );
  }
}

import { CONFIG } from "../content/config";
import type { Entity, World } from "../World";
import { BlastShotWeapon } from "../weapons/BlastShot";
import { ParabolicShotWeapon } from "../weapons/ParabolicShot";
import { RearCannonsWeapon } from "../weapons/RearCannons";
import { StraightShotWeapon } from "../weapons/StraightShot";
import type { Weapon } from "../weapons/Weapon";

export class WeaponSystem {
  private readonly weapons: Weapon[] = [
    new StraightShotWeapon(),
    new ParabolicShotWeapon(),
    new BlastShotWeapon(),
    new RearCannonsWeapon()
  ];
  private readonly weaponMap = new Map<string, Weapon>(
    this.weapons.map((weapon) => [weapon.id, weapon])
  );

  update(world: World, dtSeconds: number): void {
    for (const weapon of this.weapons) {
      weapon.update(dtSeconds);
    }

    for (const [, state] of world.getWeaponStateEntries()) {
      if (state.cooldownRemaining > CONFIG.core.zero) {
        state.cooldownRemaining = Math.max(
          CONFIG.core.zero,
          state.cooldownRemaining - dtSeconds
        );
      }
    }
  }

  tryFire(world: World, shipEntity: Entity): void {
    const state = world.getWeaponState(shipEntity);

    if (!state) {
      return;
    }

    const weapon = this.weaponMap.get(state.weaponId);

    if (!weapon) {
      return;
    }

    if (state.cooldownRemaining > CONFIG.core.zero) {
      return;
    }

    if (weapon.tryFire(world, shipEntity)) {
      state.cooldownRemaining = weapon.cooldownSeconds;
    }
  }

  cycleWeapon(world: World, shipEntity: Entity, direction: number): void {
    if (this.weapons.length === CONFIG.core.zero) {
      return;
    }

    const state = world.getWeaponState(shipEntity);

    if (!state) {
      return;
    }

    const currentIndex = this.weapons.findIndex((weapon) => weapon.id === state.weaponId);
    const safeIndex = currentIndex === CONFIG.core.negativeOne ? CONFIG.core.zero : currentIndex;
    const nextIndex = this.wrapIndex(safeIndex + direction, this.weapons.length);

    state.weaponId = this.weapons[nextIndex].id;
    state.cooldownRemaining = CONFIG.core.zero;
  }

  getWeaponName(weaponId: string): string {
    const weapon = this.weaponMap.get(weaponId);

    if (!weapon) {
      return weaponId;
    }

    return weapon.name;
  }

  getWeaponCooldown(weaponId: string): number {
    const weapon = this.weaponMap.get(weaponId);

    if (!weapon) {
      return CONFIG.core.zero;
    }

    return weapon.cooldownSeconds;
  }

  private wrapIndex(index: number, length: number): number {
    if (length <= CONFIG.core.zero) {
      return CONFIG.core.zero;
    }

    const wrapped = index % length;
    return wrapped < CONFIG.core.zero ? wrapped + length : wrapped;
  }
}

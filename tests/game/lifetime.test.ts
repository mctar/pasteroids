import { describe, expect, it } from "vitest";
import { CONFIG } from "../../src/game/content/config";
import { CollisionSystem } from "../../src/game/systems/CollisionSystem";
import { PhysicsSystem } from "../../src/game/systems/PhysicsSystem";
import { World } from "../../src/game/World";

describe("Lifetime", () => {
  it("removes expired entities", () => {
    const world = new World(CONFIG.core.one, CONFIG.core.one);
    world.spawnProjectile(
      { x: CONFIG.core.zero, y: CONFIG.core.zero },
      { x: CONFIG.core.zero, y: CONFIG.core.zero },
      CONFIG.core.half
    );

    const physics = new PhysicsSystem();
    const collision = new CollisionSystem();
    physics.update(world, CONFIG.core.one);
    collision.update(world);

    expect(world.getProjectileCount()).toBe(CONFIG.core.zero);
  });
});

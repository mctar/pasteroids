import { describe, expect, it } from "vitest";
import { CONFIG } from "../../src/game/content/config";
import { PhysicsSystem } from "../../src/game/systems/PhysicsSystem";
import { World, type WorldInitParams } from "../../src/game/World";

const buildWorld = (seed: number): World => {
  const width = CONFIG.test.determinismWidth;
  const height = CONFIG.test.determinismHeight;
  const init: WorldInitParams = {
    seed,
    startingWave: CONFIG.game.startingWave,
    shipInitialTransform: {
      position: {
        x: width / CONFIG.world.centerDivisor,
        y: height / CONFIG.world.centerDivisor
      },
      rotation: CONFIG.core.zero
    }
  };
  const world = new World(width, height, init);
  const ship = world.getShipControl(world.getPlayerShipId());
  const safeRadius = CONFIG.wave.safeRadius + (ship ? ship.radius : CONFIG.core.zero);
  const waveIndex = Math.max(CONFIG.core.zero, world.wave - CONFIG.core.one);
  const targetCount = CONFIG.wave.baseNoodles + waveIndex * CONFIG.wave.increment;
  const cappedCount = Math.min(targetCount, CONFIG.world.maxNoodles);

  world.spawnWave(cappedCount, safeRadius);

  return world;
};

const simulate = (world: World): void => {
  const physics = new PhysicsSystem();
  const seconds = CONFIG.test.determinismSeconds;
  const step = CONFIG.core.one / CONFIG.timing.fixedFps;
  const steps = Math.round(seconds * CONFIG.timing.fixedFps);

  for (let index = CONFIG.core.zero; index < steps; index += CONFIG.core.one) {
    physics.update(world, step);
  }
};

const snapshotWorld = (world: World): Array<{ entity: number; x: number; y: number; rotation: number }> => {
  const snapshot: Array<{ entity: number; x: number; y: number; rotation: number }> = [];

  for (const [entity] of world.getShipEntries()) {
    const transform = world.getTransform(entity);
    if (!transform) {
      continue;
    }
    snapshot.push({
      entity,
      x: transform.position.x,
      y: transform.position.y,
      rotation: transform.rotation
    });
  }

  for (const [entity] of world.getNoodleEntries()) {
    const transform = world.getTransform(entity);
    if (!transform) {
      continue;
    }
    snapshot.push({
      entity,
      x: transform.position.x,
      y: transform.position.y,
      rotation: transform.rotation
    });
  }

  snapshot.sort((a, b) => a.entity - b.entity);
  return snapshot;
};

describe("Determinism", () => {
  it("matches positions with the same seed after three seconds", () => {
    const seed = CONFIG.rng.seed;
    const worldA = buildWorld(seed);
    const worldB = buildWorld(seed);

    simulate(worldA);
    simulate(worldB);

    const snapA = snapshotWorld(worldA);
    const snapB = snapshotWorld(worldB);

    expect(snapA.length).toBe(snapB.length);

    const epsilon = CONFIG.math.epsilon * CONFIG.core.two;

    for (let index = CONFIG.core.zero; index < snapA.length; index += CONFIG.core.one) {
      const a = snapA[index];
      const b = snapB[index];

      expect(a.entity).toBe(b.entity);
      expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(epsilon);
      expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(epsilon);
      expect(Math.abs(a.rotation - b.rotation)).toBeLessThanOrEqual(epsilon);
    }
  });
});

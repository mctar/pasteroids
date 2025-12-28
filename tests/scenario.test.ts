import { describe, expect, it } from "vitest";
import { CONFIG } from "../src/game/content/config";
import { HeadlessRunner } from "../src/game/testkit/HeadlessRunner";
import { TestInputSource } from "../src/game/testkit/TestInputSource";
import type { InputSnapshot } from "../src/game/systems/InputSystem";
import { scanWorldForNaNs } from "../src/game/testkit/Invariants";
import type { WorldInitParams } from "../src/game/World";

const secondsToTicks = (seconds: number): number =>
  Math.round(seconds * CONFIG.timing.fixedFps);

const buildScript = (): ((tick: number) => InputSnapshot) => {
  const empty = TestInputSource.emptySnapshot();

  const rotateTicks = secondsToTicks(CONFIG.test.scenarioRotateSeconds);
  const thrustTicks = secondsToTicks(CONFIG.test.scenarioThrustSeconds);
  const straightTicks = secondsToTicks(CONFIG.test.scenarioStraightFireSeconds);
  const parabolicTicks = secondsToTicks(CONFIG.test.scenarioParabolicFireSeconds);
  const blastTicks = secondsToTicks(CONFIG.test.scenarioBlastFireSeconds);
  const switchToParabolicTick = straightTicks;
  const switchToBlastTick = straightTicks + parabolicTicks;

  return (tick: number): InputSnapshot => {
    const snapshot: InputSnapshot = { ...empty };

    if (tick < rotateTicks) {
      snapshot.leftHeld = true;
    }

    if (tick < thrustTicks) {
      snapshot.thrustHeld = true;
    }

    if (tick < straightTicks) {
      snapshot.fireHeld = true;
    } else if (tick < straightTicks + parabolicTicks) {
      snapshot.fireHeld = true;
    } else if (tick < straightTicks + parabolicTicks + blastTicks) {
      snapshot.fireHeld = true;
    }

    if (tick === switchToParabolicTick) {
      snapshot.weaponCycle = CONFIG.input.turnRight;
    }

    if (tick === switchToBlastTick) {
      snapshot.weaponCycle = CONFIG.input.turnRight;
    }

    return snapshot;
  };
};

describe("Scenario", () => {
  it("runs deterministically with scripted inputs", () => {
    const width = CONFIG.test.scenarioWidth;
    const height = CONFIG.test.scenarioHeight;
    const init: WorldInitParams = {
      seed: CONFIG.test.scenarioSeed,
      startingWave: CONFIG.game.startingWave,
      shipInitialTransform: {
        position: {
          x: width / CONFIG.world.centerDivisor,
          y: height / CONFIG.world.centerDivisor
        },
        rotation: CONFIG.core.zero
      }
    };

    const inputSource = new TestInputSource(buildScript());
    const runner = new HeadlessRunner({
      width,
      height,
      init,
      inputSource,
      spawnWaveCount: CONFIG.test.scenarioNoodleCount
    });

    const totalTicks = secondsToTicks(CONFIG.test.scenarioSeconds);
    runner.run(totalTicks);

    const world = runner.getWorld();

    expect(runner.getState()).not.toBe(CONFIG.game.states.gameOver);
    expect(world.score).toBeGreaterThanOrEqual(CONFIG.test.scenarioMinScore);
    expect(world.score).toBe(CONFIG.test.scenarioExpectedScore);
    expect(world.getNoodleCount()).toBeLessThanOrEqual(CONFIG.test.scenarioMaxNoodles);
    expect(world.getProjectileCount()).toBeLessThanOrEqual(CONFIG.world.maxProjectiles);

    const issues = scanWorldForNaNs(world);
    expect(issues, issues.map((issue) => `${issue.label}=${issue.value}`).join(", ")).toHaveLength(0);
  });
});

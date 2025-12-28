import { describe, expect, it } from "vitest";
import { CONFIG } from "../../src/game/content/config";
import {
  circleCapsuleCollision,
  getCapsuleEndpoints
} from "../../src/game/math/geometry";
import { addVec2, rotateVec2, scaleVec2, vec2 } from "../../src/game/math/vec2";

describe("circle capsule collision", () => {
  const { zero, half } = CONFIG.core;
  const quarter = half * half;
  const eighth = quarter * half;
  const longAxis = CONFIG.noodle.longAxis + CONFIG.noodle.shortAxis;
  const shortAxis = CONFIG.noodle.shortAxis;
  const circleRadius = shortAxis * half;
  const center = vec2(zero, zero);
  const epsilon = CONFIG.math.epsilon;

  it("hits capsule at side", () => {
    const sideOffset = shortAxis - epsilon;
    const circleCenter = addVec2(center, vec2(zero, sideOffset));
    const result = circleCapsuleCollision(
      circleCenter,
      circleRadius,
      center,
      zero,
      longAxis,
      shortAxis
    );

    expect(result.hit).toBe(true);
    expect(result.normal).not.toBeNull();
  });

  it("hits capsule at end cap", () => {
    const capsule = getCapsuleEndpoints(center, zero, longAxis, shortAxis);
    const offset = capsule.radius + circleRadius - epsilon;
    const circleCenter = addVec2(capsule.end, scaleVec2(capsule.axis, offset));
    const result = circleCapsuleCollision(
      circleCenter,
      circleRadius,
      center,
      zero,
      longAxis,
      shortAxis
    );

    expect(result.hit).toBe(true);
    expect(result.normal).not.toBeNull();
  });

  it("misses capsule at multiple orientations", () => {
    const rotations = [zero, CONFIG.math.tau * quarter, CONFIG.math.tau * eighth];

    for (const rotation of rotations) {
      const capsule = getCapsuleEndpoints(center, rotation, longAxis, shortAxis);
      const offset = capsule.radius + circleRadius + longAxis;
      const normal = rotateVec2(capsule.axis, CONFIG.math.tau * quarter);
      const circleCenter = addVec2(center, scaleVec2(normal, offset));
      const result = circleCapsuleCollision(
        circleCenter,
        circleRadius,
        center,
        rotation,
        longAxis,
        shortAxis
      );

      expect(result.hit).toBe(false);
    }
  });

  it("handles near-zero capsule length", () => {
    const tinyAxis = CONFIG.math.epsilon * half;
    const circleCenter = vec2(zero, shortAxis);
    const result = circleCapsuleCollision(
      circleCenter,
      circleRadius,
      center,
      zero,
      tinyAxis,
      shortAxis
    );

    expect(result.hit).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { CONFIG } from "../../src/game/content/config";
import {
  closestPointOnSegment,
  pointToSegmentDistanceSquared
} from "../../src/game/math/geometry";
import { vec2 } from "../../src/game/math/vec2";

describe("geometry", () => {
  const { zero, one, two, half, negativeOne } = CONFIG.core;
  const three = two + one;
  const four = two + two;
  const nine = three * three;
  const tiny = CONFIG.math.epsilon * half;

  it("pointToSegmentDistanceSquared returns perpendicular distance", () => {
    const start = vec2(zero, zero);
    const end = vec2(four, zero);
    const point = vec2(two, three);
    const distSq = pointToSegmentDistanceSquared(point, start, end);

    expect(distSq).toBe(nine);
  });

  it("pointToSegmentDistanceSquared returns zero on segment", () => {
    const start = vec2(zero, zero);
    const end = vec2(four, zero);
    const point = vec2(two, zero);
    const distSq = pointToSegmentDistanceSquared(point, start, end);

    expect(distSq).toBe(zero);
  });

  it("pointToSegmentDistanceSquared clamps beyond segment end", () => {
    const start = vec2(zero, zero);
    const end = vec2(two, zero);
    const point = vec2(four, zero);
    const distSq = pointToSegmentDistanceSquared(point, start, end);

    expect(distSq).toBe(four);
  });

  it("closestPointOnSegment clamps before start", () => {
    const start = vec2(one, one);
    const end = vec2(three, one);
    const point = vec2(negativeOne, one);
    const closest = closestPointOnSegment(point, start, end);

    expect(closest.x).toBe(one);
    expect(closest.y).toBe(one);
  });

  it("closestPointOnSegment clamps beyond end", () => {
    const start = vec2(zero, zero);
    const end = vec2(two, zero);
    const point = vec2(four, zero);
    const closest = closestPointOnSegment(point, start, end);

    expect(closest.x).toBe(two);
    expect(closest.y).toBe(zero);
  });

  it("handles near-zero segment length", () => {
    const start = vec2(zero, zero);
    const end = vec2(tiny, tiny);
    const point = vec2(one, one);
    const closest = closestPointOnSegment(point, start, end);
    const distSq = pointToSegmentDistanceSquared(point, start, end);

    expect(Number.isFinite(closest.x)).toBe(true);
    expect(Number.isFinite(closest.y)).toBe(true);
    expect(closest.x).toBe(zero);
    expect(closest.y).toBe(zero);
    expect(distSq).toBe(two);
  });
});

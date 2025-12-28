import { CONFIG } from "../content/config";
import { clamp } from "./scalars";
import {
  addVec2,
  dotVec2,
  rotateVec2,
  scaleVec2,
  subVec2,
  vec2,
  type Vec2
} from "./vec2";

export type CapsuleEndpoints = {
  start: Vec2;
  end: Vec2;
  radius: number;
  axis: Vec2;
};

export type CircleCapsuleHit = {
  hit: boolean;
  normal: Vec2 | null;
};

export const getCapsuleEndpoints = (
  center: Vec2,
  rotation: number,
  longAxis: number,
  shortAxis: number
): CapsuleEndpoints => {
  const segmentLength = Math.max(CONFIG.core.zero, longAxis - shortAxis);
  const halfSegment = segmentLength * CONFIG.core.half;
  const axis = rotateVec2(vec2(CONFIG.core.one, CONFIG.core.zero), rotation);
  const offset = scaleVec2(axis, halfSegment);

  return {
    start: subVec2(center, offset),
    end: addVec2(center, offset),
    radius: shortAxis * CONFIG.core.half,
    axis
  };
};

export const circleCapsuleCollision = (
  circleCenter: Vec2,
  circleRadius: number,
  capsuleCenter: Vec2,
  capsuleRotation: number,
  capsuleLongAxis: number,
  capsuleShortAxis: number
): CircleCapsuleHit => {
  const capsule = getCapsuleEndpoints(
    capsuleCenter,
    capsuleRotation,
    capsuleLongAxis,
    capsuleShortAxis
  );
  const closest = closestPointOnSegment(circleCenter, capsule.start, capsule.end);
  const delta = subVec2(circleCenter, closest);
  const distanceSq = dotVec2(delta, delta);
  const sumRadius = circleRadius + capsule.radius;
  const sumRadiusSq = sumRadius * sumRadius;

  if (distanceSq > sumRadiusSq) {
    return { hit: false, normal: null };
  }

  const epsilonSq = CONFIG.math.epsilon * CONFIG.math.epsilon;
  if (distanceSq <= epsilonSq) {
    return { hit: true, normal: capsule.axis };
  }

  const distance = Math.sqrt(distanceSq);
  const normal = scaleVec2(delta, CONFIG.core.one / distance);

  return { hit: true, normal };
};

export const closestPointOnSegment = (point: Vec2, start: Vec2, end: Vec2): Vec2 => {
  const segment = subVec2(end, start);
  const lengthSq = dotVec2(segment, segment);
  const epsilonSq = CONFIG.math.epsilon * CONFIG.math.epsilon;

  if (lengthSq <= epsilonSq) {
    return vec2(start.x, start.y);
  }

  const toPoint = subVec2(point, start);
  const t = dotVec2(toPoint, segment) / lengthSq;
  const clampedT = clamp(t, CONFIG.core.zero, CONFIG.core.one);

  return addVec2(start, scaleVec2(segment, clampedT));
};

export const pointToSegmentDistanceSquared = (
  point: Vec2,
  start: Vec2,
  end: Vec2
): number => {
  const closest = closestPointOnSegment(point, start, end);
  const delta = subVec2(point, closest);

  return dotVec2(delta, delta);
};

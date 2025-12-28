import type { Vec2, World } from "../World";

export type InvariantIssue = {
  label: string;
  value: number;
};

export const assertFiniteNumber = (label: string, value: number): InvariantIssue | null => {
  if (Number.isFinite(value)) {
    return null;
  }

  return { label, value };
};

export const assertFiniteVec2 = (label: string, value: Vec2): InvariantIssue[] => {
  const issues: InvariantIssue[] = [];
  const xIssue = assertFiniteNumber(`${label}.x`, value.x);
  if (xIssue) {
    issues.push(xIssue);
  }
  const yIssue = assertFiniteNumber(`${label}.y`, value.y);
  if (yIssue) {
    issues.push(yIssue);
  }
  return issues;
};

export const scanWorldForNaNs = (world: World): InvariantIssue[] => {
  const issues: InvariantIssue[] = [];

  for (const [entity, body] of world.getRigidBodyEntries()) {
    const velocityIssues = assertFiniteVec2(`RigidBody(${entity}).velocity`, body.velocity);
    issues.push(...velocityIssues);

    const angularIssue = assertFiniteNumber(`RigidBody(${entity}).angularVelocity`, body.angularVelocity);
    if (angularIssue) {
      issues.push(angularIssue);
    }

    const transform = world.getTransform(entity);
    if (!transform) {
      continue;
    }

    const positionIssues = assertFiniteVec2(`Transform(${entity}).position`, transform.position);
    issues.push(...positionIssues);

    const rotationIssue = assertFiniteNumber(`Transform(${entity}).rotation`, transform.rotation);
    if (rotationIssue) {
      issues.push(rotationIssue);
    }
  }

  return issues;
};

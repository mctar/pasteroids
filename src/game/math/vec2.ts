export type Vec2 = {
  x: number;
  y: number;
};

export const vec2 = (x: number, y: number): Vec2 => ({
  x,
  y
});

export const addVec2 = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x + b.x,
  y: a.y + b.y
});

export const subVec2 = (a: Vec2, b: Vec2): Vec2 => ({
  x: a.x - b.x,
  y: a.y - b.y
});

export const scaleVec2 = (v: Vec2, scalar: number): Vec2 => ({
  x: v.x * scalar,
  y: v.y * scalar
});

export const dotVec2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const lengthSquaredVec2 = (v: Vec2): number => dotVec2(v, v);

export const rotateVec2 = (v: Vec2, angleRad: number): Vec2 => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

export const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * t;

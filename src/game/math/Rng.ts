import { CONFIG } from "../content/config";

export class Rng {
  private seed: number;
  private readonly initialSeed: number;

  constructor(seed?: number) {
    const modulus = CONFIG.rng.modulus;
    const initialSeed = seed ?? this.autoSeed(modulus);

    this.initialSeed = this.normalizeSeed(initialSeed, modulus);
    this.seed = this.initialSeed;
  }

  next(): number {
    const modulus = CONFIG.rng.modulus;
    const multiplier = CONFIG.rng.multiplier;
    const increment = CONFIG.rng.increment;

    this.seed = (multiplier * this.seed + increment) % modulus;

    return this.seed;
  }

  nextFloat(): number {
    return this.next() / CONFIG.rng.modulus;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.nextFloat();
  }

  getState(): number {
    return this.seed;
  }

  getInitialSeed(): number {
    return this.initialSeed;
  }

  private normalizeSeed(value: number, modulus: number): number {
    const normalized = Math.abs(value) % modulus;
    return normalized === CONFIG.core.zero ? CONFIG.core.one : normalized;
  }

  private autoSeed(modulus: number): number {
    return Date.now() % modulus;
  }
}

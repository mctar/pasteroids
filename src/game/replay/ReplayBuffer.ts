import { CONFIG } from "../content/config";
import type { ReplayFrame } from "./ReplayTypes";

export class ReplayBuffer {
  private readonly frames: Array<ReplayFrame | undefined>;
  private readonly capacity: number;
  private head = CONFIG.core.zero;
  private length = CONFIG.core.zero;

  constructor(capacity: number) {
    this.capacity = Math.max(CONFIG.core.zero, capacity);
    this.frames = this.capacity > CONFIG.core.zero ? new Array<ReplayFrame>(this.capacity) : [];
  }

  getCapacity(): number {
    return this.capacity;
  }

  clear(): void {
    this.head = CONFIG.core.zero;
    this.length = CONFIG.core.zero;
  }

  record(frame: ReplayFrame): void {
    if (this.capacity <= CONFIG.core.zero) {
      return;
    }

    this.frames[this.head] = frame;
    this.head = (this.head + CONFIG.core.one) % this.capacity;

    if (this.length < this.capacity) {
      this.length += CONFIG.core.one;
    }
  }

  toArray(): ReplayFrame[] {
    const ordered: ReplayFrame[] = [];

    if (this.length <= CONFIG.core.zero) {
      return ordered;
    }

    const start = (this.head - this.length + this.capacity) % this.capacity;

    for (let index = CONFIG.core.zero; index < this.length; index += CONFIG.core.one) {
      const frame = this.frames[(start + index) % this.capacity];
      if (frame) {
        ordered.push(frame);
      }
    }

    return ordered;
  }
}

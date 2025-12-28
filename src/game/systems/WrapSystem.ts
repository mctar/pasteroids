import { CONFIG } from "../content/config";

export class WrapSystem {
  wrapValue(value: number, max: number): number {
    const margin = CONFIG.world.wrapMargin;
    const minValue = CONFIG.core.zero - margin;
    const maxValue = max + margin;

    if (value < minValue) {
      return maxValue;
    }

    if (value > maxValue) {
      return minValue;
    }

    return value;
  }
}

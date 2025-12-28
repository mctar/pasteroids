import type { Entity, World } from "../World";

export type Weapon = {
  id: string;
  name: string;
  cooldownSeconds: number;
  tryFire: (world: World, shipEntity: Entity) => boolean;
  update: (dtSeconds: number) => void;
};

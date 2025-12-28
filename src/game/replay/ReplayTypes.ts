import type { Vec2 } from "../World";

export type RecordedInput = {
  left: boolean;
  right: boolean;
  thrust: boolean;
  fire: boolean;
  startPressed: boolean;
  weaponCycle: number;
  pausePressed: boolean;
};

export type ReplayFrame = {
  tick: number;
  input: RecordedInput;
};

export type ReplayNoodle = {
  position: Vec2;
  velocity: Vec2;
  longAxis: number;
  shortAxis: number;
  rotation: number;
  angularVelocity: number;
};

export type ReplayHeader = {
  seed: number;
  wave: number;
  player: {
    position: Vec2;
    rotation: number;
  };
  world: {
    width: number;
    height: number;
  };
  noodles: ReplayNoodle[];
};

export type ReplayData = {
  header: ReplayHeader;
  frames: ReplayFrame[];
};

export type ReplayStatus = {
  mode: "off" | "recording" | "playback";
  tick: number;
  totalTicks: number;
};

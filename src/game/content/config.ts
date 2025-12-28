export const CONFIG = {
  core: {
    zero: 0,
    one: 1,
    two: 2,
    half: 0.5,
    negativeOne: -1
  },
  dom: {
    canvasId: "game"
  },
  math: {
    pi: Math.PI,
    tau: Math.PI * 2,
    epsilon: 1e-6
  },
  rng: {
    useSeed: true,
    seed: 1337,
    multiplier: 48271,
    increment: 0,
    modulus: 2147483647
  },
  timing: {
    fixedFps: 60,
    msPerSecond: 1000,
    maxFrameMs: 1000 / 10,
    maxSubSteps: 5
  },
  input: {
    startKey: "Space",
    fireKey: "Space",
    pauseKey: "KeyP",
    leftKey: "KeyA",
    rightKey: "KeyD",
    thrustKey: "KeyW",
    weaponPrevKey: "KeyQ",
    weaponNextKey: "KeyE",
    trailToggleKey: "KeyT",
    debugToggleKey: "Backquote",
    hitboxToggleKey: "KeyH",
    replayToggleKey: "F6",
    replayExportKey: "F7",
    replayLoadKey: "F8",
    turnLeft: -1,
    turnRight: 1,
    turnNone: 0
  },
  game: {
    states: {
      attract: "attract",
      playing: "playing",
      gameOver: "gameOver"
    },
    startingScore: 0,
    startingWave: 1
  },
  wave: {
    baseNoodles: 1,
    increment: 1,
    spawnAttempts: 12,
    safeRadius: 120
  },
  world: {
    maxNoodles: 50,
    maxProjectiles: 200,
    maxParticles: 120,
    initialNoodles: 1,
    entityStartId: 1,
    centerDivisor: 2,
    wrapMargin: 0
  },
  canvas: {
    minDpr: 1,
    maxDpr: 2,
    background: "#0f1116",
    textColor: "#f4f1de",
    accentColor: "#e07a5f"
  },
  render: {
    lineWidth: 2,
    fontFamily: "monospace",
    hintFontSize: 26,
    hintLineHeight: 32,
    hudFontSize: 16,
    hudLineHeight: 20,
    shipScale: 1,
    noodleScale: 1
  },
  debug: {
    enabled: false,
    hitboxes: false,
    projectileTrails: false,
    fpsLabel: "FPS",
    accumulatorLabel: "acc",
    stepLabel: "step",
    subStepsLabel: "sub",
    shipLabel: "ship",
    noodleLabel: "noodle",
    projectileLabel: "projectile",
    particleLabel: "particle",
    frameLabel: "frame",
    activeLabel: "Active",
    hitboxLabel: "Hitboxes",
    msSuffix: "ms",
    onLabel: "On",
    offLabel: "Off",
    overlayFontSize: 14,
    overlayLineHeight: 18,
    overlayPadding: 12,
    precision: 2,
    fpsSmoothing: 0.9,
    hitboxColor: "#f2cc8f",
    hitboxLineWidth: 1,
    trailColor: "#f2cc8f",
    trailLineWidth: 1,
    projectileTrailLength: 12
  },
  fuse: {
    scale: 0.6,
    color: "#f2cc8f",
    lineWidth: 1
  },
  explosion: {
    color: "#f2cc8f",
    lineWidth: 2
  },
  ship: {
    radius: 14,
    turnSpeed: 3.4,
    thrustAccel: 180,
    maxSpeed: 260,
    damping: 0.99,
    noseScale: 1.4,
    wingScale: 0.7,
    tailScale: 0.9,
    flameScale: 0.7,
    color: "#f4f1de"
  },
  noodle: {
    longAxis: 60,
    shortAxis: 40,
    driftSpeed: 40,
    driftAngleRad: 0.7,
    spawnOffsetRadius: 0,
    spawnOffsetAngleRad: 0,
    angularVelocity: 0.6,
    damping: 0.995,
    color: "#81b29a",
    splitThreshold: 50,
    splitScale: 0.6,
    splitCount: 2,
    splitImpulseMin: 20,
    splitImpulseMax: 60,
    tiers: [
      {
        minLongAxis: 60,
        hp: 3,
        score: 100
      },
      {
        minLongAxis: 40,
        hp: 2,
        score: 50
      },
      {
        minLongAxis: 0,
        hp: 1,
        score: 25
      }
    ]
  },
  projectile: {
    radius: 2,
    color: "#f2cc8f",
    speed: 420,
    lifetimeSeconds: 1.2,
    damage: 1,
    accel: {
      x: 0,
      y: 0
    }
  },
  weapon: {
    defaultId: "straightShot",
    straightShot: {
      id: "straightShot",
      name: "Straight Shot",
      cooldownSeconds: 0.2,
      projectileSpeed: 520,
      spawnOffsetScale: 1
    },
    parabolic: {
      id: "parabolicShot",
      name: "Parabolic Shot",
      cooldownSeconds: 0.35,
      projectileSpeed: 480,
      spawnOffsetScale: 1,
      gravity: 260
    },
    blast: {
      id: "blastShot",
      name: "Blast Shot",
      cooldownSeconds: 0.6,
      projectileSpeed: 320,
      projectileRadius: 6,
      projectileDamage: 0,
      spawnOffsetScale: 1,
      lifetimeSeconds: 1.4,
      explosionRadius: 90,
      explosionDamage: 2,
      explosionImpulse: 140,
      explosionDurationSeconds: 0.4
    },
    rearCannons: {
      id: "rearCannons",
      name: "Rear Cannons",
      cooldownSeconds: 0.35,
      projectileSpeed: 380,
      lifetimeSeconds: 1.0,
      hardpoints: [
        {
          x: -18,
          y: -8
        },
        {
          x: -18,
          y: 8
        }
      ]
    }
  },
  hud: {
    startHint: "Press Space to Start",
    restartHint: "Press Space to restart",
    pauseHint: "Paused - Press P to resume",
    scoreLabel: "Score",
    weaponLabel: "Weapon",
    waveLabel: "Wave",
    cooldownLabel: "Cooldown",
    replayLabel: "Replay",
    replayRecLabel: "REC",
    replayPlayLabel: "PLAY",
    replayOffLabel: "OFF",
    replayTickSeparator: "/",
    cooldownReady: "Ready",
    cooldownUnknown: "--",
    cooldownPrecision: 2,
    secondsSuffix: "s",
    statusLabel: "Noodles",
    fpsLabel: "FPS"
  },
  replay: {
    bufferSeconds: 10,
    tickRate: 60,
    promptTitle: "Paste replay JSON"
  },
  test: {
    determinismWidth: 800,
    determinismHeight: 600,
    determinismSeconds: 3,
    scenarioSeed: 12345,
    scenarioWidth: 800,
    scenarioHeight: 600,
    scenarioNoodleCount: 3,
    scenarioSeconds: 5,
    scenarioRotateSeconds: 0.5,
    scenarioThrustSeconds: 0.8,
    scenarioStraightFireSeconds: 1.4,
    scenarioParabolicFireSeconds: 1.4,
    scenarioBlastFireSeconds: 1.0,
    scenarioMinScore: 150,
    scenarioExpectedScore: 150,
    scenarioMaxNoodles: 3,
    invariantScanInterval: 1
  }
} as const;

export type GameState = (typeof CONFIG.game.states)[keyof typeof CONFIG.game.states];

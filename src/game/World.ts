import { CONFIG } from "./content/config";
import { Rng } from "./math/Rng";
import { clamp } from "./math/scalars";

export type Entity = number;

export type Vec2 = {
  x: number;
  y: number;
};

export type WorldInitParams = {
  seed?: number;
  startingWave?: number;
  shipInitialTransform?: {
    position: Vec2;
    rotation: number;
  };
  initialNoodles?: {
    position: Vec2;
    velocity: Vec2;
    longAxis: number;
    shortAxis: number;
    rotation: number;
    angularVelocity: number;
  }[];
};

export type Transform = {
  position: Vec2;
  rotation: number;
};

export type RigidBody = {
  velocity: Vec2;
  angularVelocity: number;
};

export type ShipControl = {
  turn: number;
  thrusting: boolean;
  radius: number;
};

export type WeaponState = {
  weaponId: string;
  cooldownRemaining: number;
};

export type Noodle = {
  longAxis: number;
  shortAxis: number;
  hp: number;
  scoreValue: number;
};

export type Projectile = {
  radius: number;
  damage: number;
  accel: Vec2;
  trail: Vec2[];
  proximityFuseEnabled: boolean;
  explosion?: ExplosionSpec;
};

export type Lifetime = {
  remainingSeconds: number;
};

export type ExplosionSpec = {
  radius: number;
  damage: number;
  impulseStrength: number;
  durationSeconds: number;
};

export type ExplosionEvent = ExplosionSpec & {
  position: Vec2;
  ageSeconds: number;
};

export type Collision = {
  a: Entity;
  b: Entity;
};

export type DebugState = {
  enabled: boolean;
  showHitboxes: boolean;
  showProjectileTrails: boolean;
  fps: number;
  frameMs: number;
  accumulatorMs: number;
  fixedStepMs: number;
  subSteps: number;
};

export class World {
  width: number;
  height: number;
  score: number;
  wave: number;
  debug: DebugState;
  collisions: Collision[] = [];
  rng: Rng;
  explosions: ExplosionEvent[] = [];

  private nextEntityId = CONFIG.world.entityStartId;
  private readonly entities = new Set<Entity>();
  private readonly transforms = new Map<Entity, Transform>();
  private readonly rigidBodies = new Map<Entity, RigidBody>();
  private readonly shipControls = new Map<Entity, ShipControl>();
  private readonly weaponStates = new Map<Entity, WeaponState>();
  private readonly noodles = new Map<Entity, Noodle>();
  private readonly projectiles = new Map<Entity, Projectile>();
  private readonly lifetimes = new Map<Entity, Lifetime>();
  private readonly expiredProjectiles = new Set<Entity>();
  private readonly pendingImpulses = new Map<Entity, Vec2>();
  private readonly playerShipId: Entity;

  constructor(width: number, height: number, init?: WorldInitParams) {
    this.width = width;
    this.height = height;
    this.score = CONFIG.game.startingScore;
    this.wave = init?.startingWave ?? CONFIG.game.startingWave;
    this.rng = new Rng(init?.seed ?? (CONFIG.rng.useSeed ? CONFIG.rng.seed : undefined));
    this.debug = {
      enabled: CONFIG.debug.enabled,
      showHitboxes: CONFIG.debug.hitboxes,
      showProjectileTrails: CONFIG.debug.projectileTrails,
      fps: CONFIG.core.zero,
      frameMs: CONFIG.core.zero,
      accumulatorMs: CONFIG.core.zero,
      fixedStepMs: CONFIG.core.zero,
      subSteps: CONFIG.core.zero
    };

    const centerX = width / CONFIG.world.centerDivisor;
    const centerY = height / CONFIG.world.centerDivisor;
    const playerStart = init?.shipInitialTransform ?? {
      position: { x: centerX, y: centerY },
      rotation: CONFIG.core.zero
    };

    this.playerShipId = this.createShip(
      playerStart.position.x,
      playerStart.position.y,
      playerStart.rotation
    );

    const noodles = init?.initialNoodles ?? [];
    for (const noodle of noodles) {
      this.spawnNoodle(
        noodle.position,
        noodle.velocity,
        noodle.longAxis,
        noodle.shortAxis,
        noodle.rotation,
        noodle.angularVelocity
      );
    }

  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  createEntity(): Entity {
    const entity = this.nextEntityId;
    this.nextEntityId += CONFIG.core.one;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.transforms.delete(entity);
    this.rigidBodies.delete(entity);
    this.shipControls.delete(entity);
    this.weaponStates.delete(entity);
    this.noodles.delete(entity);
    this.projectiles.delete(entity);
    this.lifetimes.delete(entity);
  }

  getPlayerShipId(): Entity {
    return this.playerShipId;
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getShipCount(): number {
    return this.shipControls.size;
  }

  getNoodleCount(): number {
    return this.noodles.size;
  }

  getProjectileCount(): number {
    return this.projectiles.size;
  }

  getParticleCount(): number {
    return this.explosions.length;
  }

  getTransform(entity: Entity): Transform | undefined {
    return this.transforms.get(entity);
  }

  getRigidBody(entity: Entity): RigidBody | undefined {
    return this.rigidBodies.get(entity);
  }

  getShipControl(entity: Entity): ShipControl | undefined {
    return this.shipControls.get(entity);
  }

  getWeaponState(entity: Entity): WeaponState | undefined {
    return this.weaponStates.get(entity);
  }

  getNoodle(entity: Entity): Noodle | undefined {
    return this.noodles.get(entity);
  }

  getProjectile(entity: Entity): Projectile | undefined {
    return this.projectiles.get(entity);
  }

  getLifetime(entity: Entity): Lifetime | undefined {
    return this.lifetimes.get(entity);
  }

  getShipEntries(): IterableIterator<[Entity, ShipControl]> {
    return this.shipControls.entries();
  }

  getWeaponStateEntries(): IterableIterator<[Entity, WeaponState]> {
    return this.weaponStates.entries();
  }

  getNoodleEntries(): IterableIterator<[Entity, Noodle]> {
    return this.noodles.entries();
  }

  getProjectileEntries(): IterableIterator<[Entity, Projectile]> {
    return this.projectiles.entries();
  }

  getRigidBodyEntries(): IterableIterator<[Entity, RigidBody]> {
    return this.rigidBodies.entries();
  }

  markProjectileExpired(entity: Entity): void {
    this.expiredProjectiles.add(entity);
  }

  consumeExpiredProjectiles(): Entity[] {
    const expired = Array.from(this.expiredProjectiles);
    this.expiredProjectiles.clear();
    return expired;
  }

  queueImpulse(entity: Entity, impulse: Vec2): void {
    const existing = this.pendingImpulses.get(entity);
    if (existing) {
      existing.x += impulse.x;
      existing.y += impulse.y;
      return;
    }

    this.pendingImpulses.set(entity, { x: impulse.x, y: impulse.y });
  }

  consumeImpulses(): Map<Entity, Vec2> {
    const impulses = new Map(this.pendingImpulses);
    this.pendingImpulses.clear();
    return impulses;
  }

  spawnProjectile(
    position: Vec2,
    velocity: Vec2,
    lifetimeSeconds?: number,
    options?: {
      accel?: Vec2;
      radius?: number;
      damage?: number;
      proximityFuseEnabled?: boolean;
      explosion?: ExplosionSpec;
    }
  ): Entity | undefined {
    if (this.projectiles.size >= CONFIG.world.maxProjectiles) {
      return undefined;
    }

    const entity = this.createEntity();
    const resolvedLifetime = lifetimeSeconds ?? CONFIG.projectile.lifetimeSeconds;
    const resolvedAccel = options?.accel ?? {
      x: CONFIG.projectile.accel.x,
      y: CONFIG.projectile.accel.y
    };
    const resolvedRadius = options?.radius ?? CONFIG.projectile.radius;
    const resolvedDamage = options?.damage ?? CONFIG.projectile.damage;
    const proximityFuseEnabled = options?.proximityFuseEnabled ?? false;

    this.transforms.set(entity, {
      position: {
        x: position.x,
        y: position.y
      },
      rotation: CONFIG.core.zero
    });

    this.rigidBodies.set(entity, {
      velocity: {
        x: velocity.x,
        y: velocity.y
      },
      angularVelocity: CONFIG.core.zero
    });

    this.projectiles.set(entity, {
      radius: resolvedRadius,
      damage: resolvedDamage,
      accel: {
        x: resolvedAccel.x,
        y: resolvedAccel.y
      },
      trail: [
        {
          x: position.x,
          y: position.y
        }
      ],
      proximityFuseEnabled,
      explosion: options?.explosion
    });

    this.lifetimes.set(entity, {
      remainingSeconds: resolvedLifetime
    });

    return entity;
  }

  addExplosion(event: ExplosionEvent): void {
    if (CONFIG.world.maxParticles <= CONFIG.core.zero) {
      return;
    }

    while (this.explosions.length >= CONFIG.world.maxParticles) {
      this.explosions.shift();
    }

    this.explosions.push(event);
  }

  clearCollisions(): void {
    this.collisions.length = CONFIG.core.zero;
  }

  addCollision(a: Entity, b: Entity): void {
    this.collisions.push({ a, b });
  }

  toggleDebug(): void {
    this.debug.enabled = !this.debug.enabled;
  }

  toggleHitboxes(): void {
    this.debug.showHitboxes = !this.debug.showHitboxes;
  }

  toggleProjectileTrails(): void {
    this.debug.showProjectileTrails = !this.debug.showProjectileTrails;
  }

  private createShip(centerX: number, centerY: number, rotation = CONFIG.core.zero): Entity {
    const entity = this.createEntity();

    this.transforms.set(entity, {
      position: {
        x: centerX,
        y: centerY
      },
      rotation
    });

    this.rigidBodies.set(entity, {
      velocity: {
        x: CONFIG.core.zero,
        y: CONFIG.core.zero
      },
      angularVelocity: CONFIG.core.zero
    });

    this.shipControls.set(entity, {
      turn: CONFIG.input.turnNone,
      thrusting: false,
      radius: CONFIG.ship.radius
    });

    this.weaponStates.set(entity, {
      weaponId: CONFIG.weapon.defaultId,
      cooldownRemaining: CONFIG.core.zero
    });

    return entity;
  }

  spawnNoodle(
    position: Vec2,
    velocity: Vec2,
    longAxis: number,
    shortAxis: number,
    rotation = CONFIG.core.zero,
    angularVelocity = CONFIG.noodle.angularVelocity
  ): Entity | undefined {
    if (this.noodles.size >= CONFIG.world.maxNoodles) {
      return undefined;
    }

    const entity = this.createEntity();
    const stats = this.resolveNoodleStats(longAxis);

    this.transforms.set(entity, {
      position: {
        x: position.x,
        y: position.y
      },
      rotation
    });

    this.rigidBodies.set(entity, {
      velocity: {
        x: velocity.x,
        y: velocity.y
      },
      angularVelocity
    });

    this.noodles.set(entity, {
      longAxis,
      shortAxis,
      hp: stats.hp,
      scoreValue: stats.score
    });

    return entity;
  }

  spawnWave(count: number, safeRadius: number): void {
    const availableSlots = CONFIG.world.maxNoodles - this.noodles.size;
    const spawnTarget = Math.min(count, availableSlots);

    if (spawnTarget <= CONFIG.core.zero) {
      return;
    }

    const shipTransform = this.getTransform(this.playerShipId);
    const shipPosition = shipTransform
      ? shipTransform.position
      : {
          x: this.width / CONFIG.world.centerDivisor,
          y: this.height / CONFIG.world.centerDivisor
        };

    for (let index = CONFIG.core.zero; index < spawnTarget; index += CONFIG.core.one) {
      const position = this.resolveSpawnPosition(shipPosition, safeRadius);
      const velocity = this.randomNoodleVelocity();
      const rotation = this.rng.range(CONFIG.core.zero, CONFIG.math.tau);
      const angularVelocity = this.randomNoodleAngularVelocity();

      const spawned = this.spawnNoodle(
        position,
        velocity,
        CONFIG.noodle.longAxis,
        CONFIG.noodle.shortAxis,
        rotation,
        angularVelocity
      );

      if (!spawned) {
        return;
      }
    }
  }

  private resolveSpawnPosition(shipPosition: Vec2, safeRadius: number): Vec2 {
    const safeRadiusSq = safeRadius * safeRadius;
    let candidate = {
      x: shipPosition.x,
      y: shipPosition.y
    };

    for (
      let attempt = CONFIG.core.zero;
      attempt < CONFIG.wave.spawnAttempts;
      attempt += CONFIG.core.one
    ) {
      candidate = {
        x: this.rng.range(CONFIG.core.zero, this.width),
        y: this.rng.range(CONFIG.core.zero, this.height)
      };

      const dx = candidate.x - shipPosition.x;
      const dy = candidate.y - shipPosition.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq >= safeRadiusSq) {
        return candidate;
      }
    }

    const angle = this.rng.range(CONFIG.core.zero, CONFIG.math.tau);
    const fallback = {
      x: shipPosition.x + Math.cos(angle) * safeRadius,
      y: shipPosition.y + Math.sin(angle) * safeRadius
    };

    return {
      x: clamp(fallback.x, CONFIG.core.zero, this.width),
      y: clamp(fallback.y, CONFIG.core.zero, this.height)
    };
  }

  private randomNoodleVelocity(): Vec2 {
    const angle = this.rng.range(CONFIG.core.zero, CONFIG.math.tau);

    return {
      x: Math.cos(angle) * CONFIG.noodle.driftSpeed,
      y: Math.sin(angle) * CONFIG.noodle.driftSpeed
    };
  }

  private randomNoodleAngularVelocity(): number {
    if (CONFIG.noodle.angularVelocity === CONFIG.core.zero) {
      return CONFIG.noodle.angularVelocity;
    }

    const sign =
      this.rng.nextFloat() < CONFIG.core.half ? CONFIG.core.negativeOne : CONFIG.core.one;

    return CONFIG.noodle.angularVelocity * sign;
  }

  private resolveNoodleStats(longAxis: number): { hp: number; score: number } {
    for (const tier of CONFIG.noodle.tiers) {
      if (longAxis >= tier.minLongAxis) {
        return {
          hp: tier.hp,
          score: tier.score
        };
      }
    }

    return {
      hp: CONFIG.core.one,
      score: CONFIG.core.zero
    };
  }
}

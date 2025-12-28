# Noodle Shooter — Development Prompts

A structured prompt sequence for building a browser-based arcade shooter with ECS architecture, deterministic replay, and headless testing.

---

## Non-Negotiable Rules

Apply these to every prompt:

1. **Single repo.** No extra repos, no copying into subfolders. Feature toggles live inside the app.
2. **Centralize simulation.** ONLY `PhysicsSystem` updates positions/velocities. Weapons spawn projectiles but never move them.
3. **Centralize collisions.** ONLY `CollisionSystem` computes hits, proximity fuse checks, and detonations.
4. **Config centralization.** All constants live in `src/game/content/config.ts`. No magic numbers elsewhere.
5. **Deliverables per milestone.** Provide: (a) file tree, (b) key diffs, (c) how to run, (d) tests status.
6. **Strict TypeScript.** No `any`. No `ts-ignore`.
7. **Performance target.** 60 FPS with 50 noodles and 200 projectiles.

---

## Milestone 0: Repo Scaffolding & Baseline Loop

### 0.1 — Create Project

Create a new repo structure for a browser game using Vite + TypeScript + Canvas 2D.

**Requirements:**
- Vite + TS, strict mode enabled
- Vitest, ESLint + Prettier configured
- Canvas full-window, auto-resize with `devicePixelRatio` handling
- Fixed timestep game loop with accumulator (stable physics)
- Game states: `Attract` and `Playing` (Space to start)
- Ship entity: rotate (A/D), thrust (W), screen wrap
- One noodle entity: drifts, rotates, wraps

**Deliverables:** File tree, run/test/lint/format instructions, confirm tests pass.

### 0.2 — Make Baseline Readable

Refactor for clarity:
- `src/game/Game.ts` — loop and state machine
- `src/game/World.ts` — entities and components
- `src/game/systems/` — `InputSystem`, `PhysicsSystem`, `WrapSystem`, `RenderSystem`, `UISystem`

Keep lightweight. Enforce separation, no overengineering.

---

## Milestone 1: ECS-Lite Foundation & Debug Overlay

### 1.1 — ECS-Lite Structure

**Entity/Component design:**
- Entities are numeric IDs
- Components stored in `Map<EntityId, Component>`
- Components: `Transform`, `RigidBody`, `ShipControl`, `Noodle`, `Projectile` (stub), `Lifetime` (stub)
- World exposes create/destroy/query methods
- Systems operate on component sets

**Debug overlay** (toggle with `` ` ``):
- FPS, dt, accumulator
- Entity counts by type
- Hitbox rendering toggle

### 1.2 — Config Centralization

Create `src/game/content/config.ts` with all constants:
- Ship: thrust, turn speed, damping, radius
- Noodle: spawn values, longAxis/shortAxis defaults
- Wrap margin, rendering scale factors, debug flag defaults

Confirm no leftover magic numbers in systems (UI layout excepted).

---

## Milestone 2: Noodle Geometry & Collision Math

### 2.1 — Geometry Utilities

Add `src/game/math/`:
- `Vec2` utilities (immutable or minimal mutable)
- `clamp`, `lerp`
- `pointToSegmentDistanceSquared`
- `rotateVector`
- `closestPointOnSegment`

**Tests:** Point-segment distance, closest point, numeric stability for near-zero segments.

### 2.2 — Noodle as Oriented Capsule

**Capsule representation:**
- `capsuleRadius = shortAxis / 2`
- `segmentLength = max(0, longAxis - shortAxis)`
- Axis aligns with noodle rotation
- Endpoints computed from position + rotated axis

**Collision helper:** Circle vs oriented capsule (returns boolean + penetration normal).

**Tests:** Circle hits side, hits end cap, misses at various orientations.

### 2.3 — Integrate CollisionSystem

Implement `CollisionSystem`:
- Ship vs noodle collision
- On collision → Game Over state ("Press Space to restart")
- Hitbox rendering uses same geometry computations

---

## Milestone 3: Projectile Pipeline & Straight Weapon

### 3.1 — Projectile Entity & Lifetime

**Projectile component:** radius, damage, velocity, optional accel vector (default zero).

**Lifetime component:** Remaining seconds, removes entity on expiry.

**PhysicsSystem:** Updates position/velocity for all entities with `Transform` + `RigidBody`.

Confirm exactly one place does integration. Add test for Lifetime expiry.

### 3.2 — Weapon Framework & Straight Shot

**Weapon interface:**
```typescript
interface Weapon {
  id: string;
  name: string;
  cooldown: number;
  tryFire(world: World, shipEntity: EntityId): void;
  update(dt: number): void;
}
```

- `WeaponSystem` manages current weapon and cooldown
- `WeaponState` component on ship
- Controls: Space fires, Q/E cycles weapons

**StraightShot:** Projectile spawns at ship nose with forward velocity + ship velocity.

**HUD:** Score, weapon name, cooldown indicator, wave (stub).

### 3.3 — Projectile vs Noodle Collisions & Scoring

**CollisionSystem extension:**
- Projectile vs noodle (circle vs capsule)
- On hit: destroy projectile, apply damage, split noodle if above threshold

**Splitting rules (in config):**
- If `longAxis > splitThreshold`: spawn 2 smaller noodles
- `childLongAxis = parentLongAxis * splitScale`
- Inherit velocity + random impulse

**Deterministic RNG:** `src/game/math/Rng.ts` with seed, config flag for repeatable runs.

---

## Milestone 4: Parabolic Shots

### 4.1 — Parabolic Weapon Mode

**Design:** World-space acceleration `accel = (0, config.weapons.parabolic.gravity)`

**Implementation:**
- Projectile has accel vector
- `PhysicsSystem` applies `v += accel * dt`

Weapon only sets projectile accel at spawn. No special casing elsewhere.

Optional: Debug toggle for last N projectile trails.

---

## Milestone 5: Blast Weapon & Proximity Fuse

### 5.1 — Explosion Events & Blast Projectile

**Blast weapon:**
- Slower, larger radius projectile
- Detonates on impact OR timeout
- Creates `Explosion` event

**Explosion event:** `{ position, radius, damage, impulseStrength }`

`CollisionSystem` applies explosion effects to noodles within radius.

**Visual:** Expanding ring particle.

Weapons emit events only—no direct damage application.

### 5.2 — Proximity Fuse (Tied to longAxis)

**Fuse logic:**
- `fuseRadius = config.fuse.scale * noodle.longAxis`
- Fused projectiles detonate when within `(fuseRadius + projectile.radius)` of noodle
- Implemented in `CollisionSystem` only

**Projectile flag:** `proximityFuseEnabled: boolean`
- Blast: enabled
- Straight/Parabolic: disabled by default

**Debug:** Draw fuseRadius circle around noodles.

---

## Milestone 6: Rear Cannons

### 6.1 — Rear Cannon Weapon Mode

- Fires two projectiles from rear hardpoints
- Hardpoints are offsets in ship local space (defined in config)
- Projectiles travel opposite forward direction, inherit ship velocity

HUD shows "Rear Cannons" when active.

---

## Milestone 7: Progression & Performance

### 7.1 — Waves & Difficulty

**Progression:**
- Wave starts with N noodles, increases each wave
- Wave ends when all noodles cleared
- Safe spawn radius around ship at wave start
- Score increments by noodle size tier

**Features:**
- Pause toggle (P)
- Game over screen with restart
- Optional: Pickup drops for temporary weapon buffs (minimal)

### 7.2 — Performance Guardrails

**Caps:** Max noodles, max projectiles, max particles.

**Overflow handling:** Drop oldest particles first, then deny new projectiles.

**Debug overlay additions:**
- Active noodle/projectile/particle counts
- Frame time

---

## Milestone 8: Deploy & Documentation

### 8.1 — GitHub Pages Deploy

**GitHub Actions workflow:**
- Build with Vite
- Deploy dist to Pages
- Correct base path handling
- CI runs: `npm ci`, `npm test`, `npm run lint`, `npm run build`

### 8.2 — README

**Contents:**
- Game description
- Controls
- Local dev setup
- Tests and lint
- Deploy instructions
- Architecture overview (systems, world, components)
- "How to add a new weapon" (3-step example)

---

## Hardening 1: Deterministic Replay

### H1.1 — Record & Replay Inputs + RNG Seed

Add replay capture for last N seconds with deterministic playback.

**ReplayBuffer records per fixed-timestep tick:**
- Tick index
- Input snapshot (keys pressed)
- Edge-triggered weapon switches

**Replay header (initial state):**
- RNG seed
- Starting wave number
- Ship initial position/rotation
- Noodle spawn params (or deterministic from seed)

**Controls:**
- F6 — toggle recording (default on)
- F7 — export replay to clipboard/console
- F8 — load replay from `window.prompt`, start playback

**Playback behavior:**
- Disable live keyboard input
- Feed recorded inputs to `InputSystem` per tick
- Reset RNG with replay seed
- Reset world to stored starting conditions

**HUD indicator:** "REC" or "PLAY", current/total ticks in playback.

**Architecture:**
- `InputSystem` accepts injected `InputSource`: `LiveKeyboardInput` or `ReplayInputSource`
- All replay logic in `src/game/replay/`

**New files:** `ReplayTypes.ts`, `ReplayBuffer.ts`, `ReplayController.ts`, `ReplayInputSource.ts`

### H1.2 — Make Spawning Replay-Safe

Make world init and wave spawning deterministic under seeded RNG.

**Requirements:**
- All random calls go through `Rng` abstraction
- Confirm wave spawning uses ONLY `Rng`, not `Math.random`
- Add `WorldInitParams`: `{ seed, startingWave, shipInitialTransform }`

**Verification:** Run twice with same seed and no input—entity positions after 3s match within epsilon.

---

## Hardening 2: Headless Testing

### H2.1 — Headless Simulation Harness

Add headless simulation and one deterministic scenario test.

**`src/game/testkit/HeadlessRunner.ts`:**
- Builds World, constructs systems (excludes DOM/Canvas systems)
- Runs fixed timestep for N ticks
- Accepts injected `InputSource` (`ReplayInputSource` or `TestInputSource`)

**`TestInputSource`:** Returns scripted input snapshot per tick.

**Scenario test (`tests/scenario.test.ts`):**
- Seed = 12345, Wave 1 with 3 noodles
- Scripted 5-second input sequence:
  - Rotate/thrust to avoid collision
  - Fire straight weapon
  - Switch to parabolic, fire
  - Switch to blast, fire
- **Assertions:**
  - Player alive
  - Score ≥ minimum (exact value if stable)
  - Noodle count ≤ max
  - Projectile count within cap
  - No NaN in Transform/RigidBody maps

Test must run in Node with Vitest, no rendering dependencies.

### H2.2 — Invariants Checker

Add invariants checker for headless tests and optional debug mode.

**`src/game/testkit/Invariants.ts`:**
```typescript
assertFiniteVec2(v: Vec2, label: string): void
assertFiniteNumber(n: number, label: string): void
scanWorldForNaNs(world: World): string[]  // returns issue list
```

**Integration:**
- `HeadlessRunner` runs scan every X ticks (configurable)
- Fail fast with helpful message if issues found
- Cheap for gameplay—only per-tick in tests, not shipped

**Deliverables:**
- Invariants implementation
- Scenario test reports useful failures
- Tests pass

---

## Standard Prompt Footer

> Before implementing, restate your plan in 6 bullet points. Then implement. Then show the file tree and key diffs.
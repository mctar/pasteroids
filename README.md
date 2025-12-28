# Pasta Asteroids

Pasta Asteroids is a fast, arcade-style shooter built on Canvas 2D. Pilot a ship, dodge drifting noodles, and clear waves with multiple weapon modes.

## Controls
- Space: start (attract), fire (playing), restart (game over)
- A / D: rotate
- W: thrust
- Q / E: cycle weapons
- P: pause
- F6: toggle replay recording
- F7: export replay JSON (clipboard or console)
- F8: load replay JSON (prompt)
- `: debug overlay
- H: hitboxes
- T: projectile trails

## Replay
- Recording is on by default and keeps the last N seconds of fixed-timestep inputs.
- F6 toggles recording, F7 exports the replay JSON, and F8 loads a replay for playback.
- During playback, live keyboard input is disabled and recorded inputs drive the game.
- Replays store the RNG seed plus initial world setup (wave, ship pose, initial noodles) so playback is deterministic.

## Local Development
- `npm install`
- `npm run dev`

## Tests and Lint
- `npm test`
- `npm run lint`
- `npm run format`

## Headless Test Harness
- `HeadlessRunner` (`src/game/testkit/HeadlessRunner.ts`) runs fixed-timestep simulation without DOM/Canvas.
- `TestInputSource` (`src/game/testkit/TestInputSource.ts`) feeds scripted inputs per tick.
- `Invariants` (`src/game/testkit/Invariants.ts`) scans for NaN/Infinity in transforms and rigid bodies.
- Scenario and determinism tests run in Node via Vitest, including seeded replays and stability checks.

## Deploy (GitHub Pages)
1. Push to a GitHub repo.
2. In `Settings > Pages`, set **Build and deployment** to **GitHub Actions**.
3. Ensure the default branch is `main`.
4. The workflow builds `dist` and deploys it to Pages.

To preview the Pages base path locally:
`GITHUB_PAGES=true GITHUB_REPOSITORY=owner/repo npm run build`

## Architecture Overview
- `World` (`src/game/World.ts`): owns entity ids, component maps, RNG, and spawn helpers.
- `WorldInitParams`: seed, starting wave, and ship transform for deterministic runs and replays.
- Components: `Transform`, `RigidBody`, `ShipControl`, `WeaponState`, `Noodle`, `Projectile`, `Lifetime`.
- Systems:
  - `InputSystem`: translates keyboard input into ship controls and toggles.
  - `WeaponSystem`: manages weapon cooldowns and firing.
  - `PhysicsSystem`: the only place that updates positions/velocities.
  - `CollisionSystem`: the only place that resolves hits, fuse checks, and detonations.
  - `WrapSystem`: screen-edge wrap logic.
  - `RenderSystem` + `UISystem`: drawing and HUD/debug overlays.
- Testkit:
  - `HeadlessRunner`: simulates the core loop in tests.
  - `TestInputSource`: scripted inputs for deterministic scenarios.
  - `Invariants`: detects non-finite values in world state.

## Add a New Weapon (3 Steps)
Example: add a "Scatter Shot" weapon.
1. Add config in `src/game/content/config.ts`:
   - `weapon.scatterShot: { id, name, cooldownSeconds, projectileSpeed, ... }`
2. Create `src/game/weapons/ScatterShot.ts` implementing `Weapon` and spawn projectiles via `world.spawnProjectile(...)`.
3. Register it in `src/game/systems/WeaponSystem.ts` and map its name in `UISystem.resolveWeaponName`.

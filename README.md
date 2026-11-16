# Sector Nine — Tactical FPS

A round-based tactical first-person shooter in the Counter-Strike style,
built original from the ground up for make.fun `threejs-fps-01`.
Static files, three.js 0.187.0 vendored, no build step, no network.
Open `game/index.html` from any static server
(`node serve.ts` → http://localhost:8080) and play single-player vs bots.

## The game

Vanguard (you + 2 bots) attacks; Crimson (4 bots) defends Sites A and B.
Win a round by planting the spike and defending it until detonation, or by
eliminating the Crimson squad. First to 4 rounds takes the match
(max 7 rounds). Money earned each round buys weapons, armor and grenades
in the buy phase between rounds.

- **Two maps:** Sector Nine (dusk industrial yard, open lanes) and Foundry
  (night furnace hall — denser fog, furnace glow, silos and a mid
  connector). Pick on the start screen; the HUD shows the map name.
- **Gunplay:** raycast hits, 2.5x headshots, recoil + spread that punish
  firing on the move, acceleration, crouch, jump, AABB map collision,
  impact sparks and pooled tracers with a muzzle-flash light.
- **Arsenal:** 5 weapons — P9 sidearm (free), VK-9 SMG ($700), AR-77 rifle
  ($2,400), new VK-7 Marksman ($2,900, semi-auto, 2x scope, one-tap
  headshot) and LW-50 Longshot sniper ($4,000, 3x scope). Right mouse aims;
  the scoped guns darken the view to a scope circle.
- **Tactics:** spike plant/defuse objective, buy economy ($800 start,
  +$300 kill, +$325 round win, +$250 round loss with a +$50 loss-streak
  bonus capped at +$150, +$300 plant), 5 weapons + frag grenade, bots that
  patrol lanes, hold sites, react to sight and sound, rush a planted spike
  and defuse it — each bot rolls a skill tier (rookie / veteran / elite,
  reshuffled every round) plus its own jitter; elite defenders hold their
  angle instead of patrolling, and the squad calls out contacts, rotations
  and defuses on the radio.
- **Game feel:** round-end slow motion, death recap (killer, damage dealt,
  accuracy), hitmarker, damage direction indicator, radio callouts,
  plant/defuse progress bars, landing thud and footsteps.
- **HUD:** health, armor, ammo, money, round timer, score, map name,
  killfeed, minimap (enemies shown when spotted, site letters from the
  map), crosshair that widens with movement, scope overlay.
- **Sound:** fully procedural WebAudio (shots per weapon, hits, reload,
  plant beeps, explosion, footsteps, radio blips, scope click, round
  stingers) — no audio assets.

## Controls

WASD move · mouse look (pointer lock) · click fire · right mouse aim/scope ·
R reload · 1–5 weapons · G frag grenade · E plant spike (hold, inside a
site) · Ctrl/C crouch · Space jump · Enter start round early.

## Files

| File | Job |
| --- | --- |
| `game/index.html` | HUD markup + import map (`three` → vendored module) |
| `game/src/main.js` | Boot, fixed 60 Hz sim loop, slow-mo, `?shot=` captures |
| `game/src/game.js` | Match state machine, economy, spike, grenades, tiers |
| `game/src/map.js` | Sector Nine + Foundry arenas, sky domes, colliders |
| `game/src/bots.js` | Bot AI (patrol / engage / push / defuse, skill tiers) |
| `game/src/player.js` | Movement physics, crouch, jump, collision |
| `game/src/weapons.js` | Arsenal data, view-models, tracers, impact sparks |
| `game/src/hud.js` | DOM HUD, buy menu, minimap, scope, death recap |
| `game/src/input.js` | Keyboard + pointer-lock mouse |
| `game/src/audio.js` | Procedural WebAudio SFX |
| `game/src/util.js` | RNG, AABB segment test, body movement |
| `game/src/palette.js` | Palettes for both maps + sky gradients |
| `game/vendor/three/` | three.js 0.187.0, byte for byte from the kit |
| `main.ts` | Entrypoint: copies game/ + screenshots/ to /output, writes dossier.json |
| `vendor/makefun-threejs.ts` | Kit's dossier library, unchanged |
| `serve.ts` | Dev static server |
| `screenshots/` | 4 real renders of the game's own code |

## Screenshots

Taken headless from the game's own `?shot=` captures
(`shots.json`): `1-foundry.jpg` (Foundry firefight, cover),
`2-start.jpg` (menu + map picker), `3-play.jpg` (Sector Nine firefight),
`4-end.jpg` (round won).

## License

MIT — see `LICENSE`.

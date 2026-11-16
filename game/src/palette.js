// palette.js — one palette per map, one shared accent set.
// Sector Nine is a dusk industrial yard; Foundry is the same yard at night,
// lit by furnace glow. Canvas dark blue-grey, warm amber accent, teal
// Vanguard vs ember Crimson — the two teams read at a glance on both maps.
export const PALETTE = {
  canvas: 0x0d1117,
  fog: 0x0d1117,
  ground: 0x23282e,
  groundLine: 0x2e343b,
  wall: 0x3a4149,
  wallDark: 0x2b3138,
  crate: 0x4a4238,
  crateAlt: 0x3d4a42,
  containerA: 0x8a5a2b,
  containerB: 0x2f5d6b,
  accent: 0xf0a830,
  siteA: 0xf0a830,
  siteB: 0x35c4d8,
  vanguard: 0x35c4a8,
  crimson: 0xe4572e,
  ink: 0xe8e4d8,
  muted: 0x9aa3ab,
  sky: 0x1a2430,
};

// Foundry (night map): colder ground, hotter lights, deeper fog.
export const FOUNDRY = {
  canvas: 0x07090d,
  fog: 0x07090d,
  ground: 0x1c1f24,
  groundLine: 0x262b31,
  wall: 0x2e343c,
  wallDark: 0x22262c,
  crate: 0x3d362c,
  crateAlt: 0x2f3d36,
  containerA: 0x6e4520,
  containerB: 0x24484f,
  furnace: 0x8a4a1a,
  furnaceGlow: 0xff7a1a,
  pipe: 0x4a4f55,
  sky: 0x05070a,
};

// Dusk sky gradient (top -> horizon) for Sector Nine; night gradient for Foundry.
export const SKY = {
  sectorNine: { top: 0x2c3e55, horizon: 0xc96f2e },
  foundry: { top: 0x04060a, horizon: 0x241708 },
};

export const CSS = {
  canvas: '#0d1117',
  surface: '#181d22',
  hairline: '#2c323a',
  ink: '#e8e4d8',
  muted: '#98a0a8',
  accent: '#f0a830',
  vanguard: '#35c4a8',
  crimson: '#e4572e',
  danger: '#e4572e',
};

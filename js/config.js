// Saved defaults for Cat Naps.
// The tool panel (press T, or open the page with #tools) edits a live copy of these.
// "Copy settings" in the panel produces a prompt that asks Claude Code to write new values here.
window.CAT_DEFAULTS = {
  colors: {
    wall: '#e8e1d6',      // room behind everything
    floor: '#cbb79e',     // floorboards
    ink: '#2e2a24',       // outlines, the cat
    sun: '#ffeec2',       // the sunbeam
    cushion: '#f3ece0',   // cushion face
    accent: '#8a7b5e',    // cues and success
    night: '#1b1a24'      // the dim that comes in as the room quietens
  },
  motion: {
    curtainLag: 9,        // how closely the curtain follows the hand (higher = tighter)
    smoothPower: 1,       // × how much each stroke flattens
    hushRate: 0.27,       // quiet gained per second while held
    leakRate: 0.33,       // quiet lost per second after letting go
    transitionMs: 800,    // scene change
    easing: 'easeInOut'   // linear | easeIn | easeOut | easeInOut | spring
  },
  targets: {
    beamLow: 0.52, beamHigh: 0.84,   // how far open the curtain should be
    smoothMin: 0.62, loftMin: 0.24,  // the cushion must be smooth and still lofty
    hushHold: 0.9                    // seconds of full quiet before the cat sleeps
  }
};

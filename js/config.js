// Saved defaults for Cat Naps — "Morning Shift".
// The tool panel (press T, or open the page with #tools) edits a live copy of these.
// "Copy settings" writes a prompt that asks Claude Code to save them back here.
window.CAT_DEFAULTS = {
  colors: {
    skyDayTop:   '#7FB6E8',   // a clear morning, straight up
    skyDayMid:   '#BCDCF2',
    skyDayLow:   '#F3E8DC',   // warm haze where the sky meets the hills
    skyNightTop: '#18213F',
    skyNightMid: '#2B3463',
    skyNightLow: '#5B4C78',
    grassTop:    '#86C88F',   // the far field, slightly cooler
    grassLow:    '#ADDCA3',   // the near grass, warmer and lighter
    grassNight:  '#2E4A52',
    treeFar:     '#8ECBB4',
    treeNear:    '#5FA98F',
    hill:        '#AFDCC9',
    bed:         '#E8907E',   // the basket — the only strong colour that is not the fish
    cushion:     '#F6E3D2',
    dish:        '#F4EEE3',
    fish:        '#FF9D3D',
    cat:         '#0C1317',   // she is the only true black in the frame, day or night
    glow:        '#FFF1BE'    // every suggestion in the piece is made of this one colour
  },
  motion: {
    wakeSpeed:   4.4,         // how sharply she comes awake
    sleepSpeed:  2.6,         // how fast she drops back under
    walkSpeed:   78,          // px per second walking
    runSpeed:    152,         // px per second once she has seen the fish
    duskSpeed:   0.55         // how fast the sky finishes turning once the sun is in the notch
  },
  scene: {
    decor:       1,           // bushes, tufts, flowers, logs — 0 strips the field bare
    cloud:       1,
    grain:       0.05,
    glowStrength: 1.25,          // how loud the suggestions are
    hintWait:    2.2          // seconds of nobody doing anything before a suggestion comes up
  },
  cat: {
    size:        1.2,
    bristle:     1,
    appetite:    2.2,         // seconds spent eating
    strokes:     5            // how many strokes it takes to smooth her down
  }
};

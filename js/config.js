// Saved defaults for Cat Naps — "Night Shift".
// The tool panel (press T, or open the page with #tools) edits a live copy of these.
// "Copy settings" writes a prompt that asks Claude Code to save them back here.
window.CAT_DEFAULTS = {
  colors: {
    skyNight:  '#0B1A24',   // petrol blue, the middle of the night
    skyDay:    '#C6DAD4',   // pale mint, the middle of the day
    dusk:      '#E8793F',   // the burn that passes through at dawn and dusk
    roadNight: '#13222A',   // wet asphalt after dark
    roadDay:   '#9DB2AD',   // the same asphalt in daylight
    sodium:    '#FFA23F',   // the street lamp
    cat:       '#050C10'    // the cat is the only true black in the frame
  },
  motion: {
    dayLength:   110,       // seconds for a whole day and night
    settleDelay: 1.4,       // seconds left alone before it lies back down
    wakeSpeed:   4.4,       // how sharply it startles
    sleepSpeed:  0.9,       // how slowly it sinks back under
    walkSpeed:   74         // px per second when it goes to the fish
  },
  scene: {
    reflection:  0.42,      // how much the wet road gives back
    rain:        1,         // drizzle through the lamp cone after dark (0 = dry)
    grain:       0.06,      // film grain over everything
    lampFlicker: 1          // how restless the sodium lamp is
  },
  cat: {
    size:        1.25,      // how big the cat is drawn
    bristle:     1,         // how far the fur stands up
    nightRoam:   1,         // how often it moves itself after dark (0 = never)
    appetite:    2.2        // seconds spent eating before lying down again
  }
};

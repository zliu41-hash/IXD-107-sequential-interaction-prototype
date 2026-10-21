// Saved defaults for the prototype.
// The tool panel (press T, or open the page with #tools) edits a live copy of these values.
// "Copy settings" in the panel produces a prompt that asks Claude Code to write the new values here.
window.TEA_DEFAULTS = {
  colors: {
    background: '#e4e1d9',   // room around the phone
    porcelain: '#fbfaf6',    // gaiwan, cups, screen
    ink: '#24221e',          // outlines and text
    accent: '#6f8f7f',       // celadon: cues, active step, success
    water: '#d7e0dc',        // fresh water in the kettle
    teaLight: '#efe3b2',     // a very short steep
    teaMid: '#c98b3c',       // a balanced cup
    teaStrong: '#6a3313'     // an over-steeped cup
  },
  motion: {
    heatSpeed: 1,            // × base heating rate
    leafGravity: 1100,       // px/s² for falling leaves
    pourFlow: 1,             // × base pour rate
    transitionMs: 700,       // scene change duration
    easing: 'easeInOut'      // linear | easeIn | easeOut | easeInOut | spring
  },
  targets: {
    tempLow: 90, tempHigh: 95,     // °C, oolong water
    gramsLow: 5, gramsHigh: 7,     // g of leaf for a 100 ml gaiwan
    steepLow: 10, steepHigh: 20    // s at 93 °C and 6 g (scaled by your earlier choices)
  }
};

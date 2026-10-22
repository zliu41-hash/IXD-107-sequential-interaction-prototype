# Cat Naps — sequential interaction prototype

Project 2 interaction prototype for IXD 107, built with Claude Code and published with GitHub Pages.

**Live prototype:** open `index.html` on this repository's GitHub Pages site.

## The sequence

Get a cat to fall asleep by making one corner of a room worth sleeping in. Each step unlocks only after the one before it holds, and the choices carry forward.

| Step | Gesture | Goal | What carries forward |
|---|---|---|---|
| 1. Open the curtain | Drag the curtain's pull | Lay the sunbeam across the rug — not so wide it glares | How warm the room looks |
| 2. Smooth the cushion | Swipe back and forth | Flatten the lumps but leave the loft | How quickly the cat settles |
| 3. Hush the room | Press and hold anywhere | Hold until the breathing evens out | — |
| Asleep | — | A summary of light, loft and hush | — |

No obvious buttons. The curtain has a pull, the cushion has lumps and loose fibres, the noise sources send out rings — and the cat is the progress bar: it turns its head, walks over, kneads, half-closes its eyes.

## Tool panel ("Room tuning")

Press **T** (or open the page with `#tools`) to show a panel for colours, motion and targets.
**Copy settings** produces a prompt for Claude Code that writes the values into `js/config.js` as the saved defaults.
The panel is hidden by default for demos.

## Files

```
index.html            the final prototype (GitHub Pages serves this)
css/style.css         layout and panel styles
js/config.js          saved defaults (colours, motion, targets)
js/app.js             the sequence: curtain → cushion → hush → asleep
js/panel.js           the "Room tuning" tool panel
studies/              the three Week 4 interaction studies, unchanged
docs/week5/           screenshots used in the Week 5 process document
.nojekyll             tells GitHub Pages to serve files as they are
```

No build step and no server: everything runs directly in the browser.

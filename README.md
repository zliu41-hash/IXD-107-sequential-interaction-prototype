# Gongfu Tea — sequential interaction prototype

Project 2 interaction prototype for IXD 107, built with Claude Code and published with GitHub Pages.

**Live prototype:** open `index.html` on this repository's GitHub Pages site.

## The sequence

One cup of oolong, brewed in three steps. Each step unlocks only after the previous one succeeds, and each choice carries forward into the next.

| Step | Gesture | Goal | What carries forward |
|---|---|---|---|
| 1. Heat the water | Press + hold the kettle | Let go inside 90–95 °C | Water temperature |
| 2. Add the leaves | Tap the tea jar (1 tap ≈ 1 g) | 5–7 g for a 100 ml gaiwan | Amount of leaf |
| 3. Pour the tea | Drag the gaiwan to tilt it | Pour inside the steep window | Hotter water and more leaf make the tea steep faster, so the window shifts |
| Your cup | — | Summary of temperature, leaf and steep time | — |

The kettle comes back between steps 2 and 3 to fill the gaiwan with the water heated in step 1.

## Tool panel ("Tea tuning")

Press **T** (or open the page with `#tools`) to show a panel for colours, motion and targets.
**Copy settings** produces a prompt for Claude Code that writes the values into `js/config.js` as the saved defaults.
The panel is hidden by default for demos.

## Files

```
index.html            the final prototype (GitHub Pages serves this)
css/style.css         layout and panel styles
js/config.js          saved defaults (colours, motion, targets)
js/app.js             the sequence: heat → leaves → pour → your cup
js/panel.js           the "Tea tuning" tool panel
studies/              the three original Week 4 interaction studies, unchanged
.nojekyll             tells GitHub Pages to serve files as they are
```

No build step and no server: everything runs directly in the browser.

## Week 5 documentation

`docs/week5/` holds the tool-panel screenshot and the three settings variations
used in the Week 5 process document.

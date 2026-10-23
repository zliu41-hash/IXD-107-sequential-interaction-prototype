# Project notes for Claude Code

This repository holds a static GitHub Pages prototype (`index.html` at the root) and the
three Week 4 interaction studies in `studies/`. Keep the study folders unchanged — they are
submitted separately and are deliberately grayscale.

The final prototype is **one continuous scene**. There are no screens to flip between, no
step tracker, no success or failure states, and nothing that ends. If a change would add a
sequence of pages, a progress indicator, or a check mark, it is the wrong change.

She starts asleep, wakes when clicked, walks to wherever the street is clicked, runs to the
fish when the fish is clicked, and goes back to sleep `CFG.motion.sleepAfter` seconds after the
last interaction. Nothing drawn on the cat glows — she is a flat silhouette, and all the light
in the frame belongs to the lamps, the puddles and the rain.

Saved defaults live in `js/config.js`; the "Street tuning" panel (`js/panel.js`) edits a live
copy of them and never writes to disk.

`index.html` loads the stylesheet and the three scripts itself, appending `?v=<timestamp>` at
load time, so every visit fetches the current code. Do not replace that with plain `<link>` and
`<script src>` tags: a fixed token written into the file is useless once the browser has cached
the file itself, which is what left people looking at old builds. Nothing needs stamping
before a commit.

## How to ask questions

Use the AskUserQuestion tool for every question. Do not write questions as a list in your
reply. Ask one question at a time and wait for my answer before asking the next. For each
question, offer 2–4 suggested answers based on what you found in the studies. I can always
pick "Other" to type my own.

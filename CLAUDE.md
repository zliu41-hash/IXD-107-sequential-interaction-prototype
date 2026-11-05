# Project notes for Claude Code

This repository holds a static GitHub Pages prototype (`index.html` at the root) and the
three Week 4 interaction studies in `studies/`. Keep the study folders unchanged — they are
submitted separately and are deliberately grayscale.

The final prototype is **one continuous scene** that runs a fixed sequence: she is asleep,
you wake her, you send her out of the rain, you feed her, she lies back down and it is over.
At each step only that step's own interaction answers; the others are inert until their turn.
There are still no screens to flip between, no step tracker, no progress indicator, no check
marks and no success or failure — being "behind" is not a state the piece can be in, and a
touch at the wrong moment is never an error. It only makes the current suggestion flare.

The subject of the piece is being led. A lit patch of road under the next thing worth
touching, the street quieting everywhere else, a ripple on bare road and her turning to look
are the whole vocabulary — there are no words, arrows or buttons, and that restriction is the
point, not an obstacle to work around. The measure of the piece is whether someone who has
never seen it gets from start to finish without being told anything, so a suggestion that is
too faint to act on is a defect, not restraint.

It rains everywhere except inside the lamp's cone, and that one dry, warm patch is what the
whole piece turns on: she starts asleep out in the rain, shivers once she is awake and leans
toward the light, and the second step completes only when she is actually under the lamp. You
click where she should go and she walks there herself — clicking is something nobody has to be
taught, which dragging is not — so sending her to the wrong place is allowed and simply leaves
her in the wet. The fish sits under the lamp too, so feeding her never walks her back out. Walking to a clicked spot still exists in
the code but no step accepts it, so it never runs. The sequence
owns her sleep — `CFG.motion.sleepAfter` no longer puts her under mid-sequence, and once she
has eaten she settles for good. A touch after that starts the whole thing over. Nothing drawn on the cat glows — she is a flat silhouette, and all the light
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

# Project notes for Claude Code

This repository holds a static GitHub Pages prototype (`index.html` at the root) and the
three Week 4 interaction studies in `studies/`. Keep the study folders unchanged — they are
submitted separately and are deliberately grayscale.

The final prototype is **one continuous scene** that runs a fixed sequence of five steps:
she is asleep in her basket, you lift her out, you put the fish in her dish, you smooth her
fur down five times, you take the sun out of the sky, and you carry her back to bed. At each
step only that step's own object answers; the others are inert until their turn. A touch at
the wrong moment is never an error — it only makes the current suggestion flare.

The subject of the piece is being led. There are no words and no buttons, and that
restriction is the point, not an obstacle to work around. There is **exactly one arrow**,
in the fourth step, and the reasoning for it is under "The sun step" below — it is an
exception that was argued for and taken, not a loophole. Do not add a second one. The measure of the piece is whether
someone who has never seen it gets from start to finish without being told anything, so a
suggestion that is too faint to act on is a defect, not restraint.

## The one suggestion

Everything the piece says, it says with light. The thing to take hold of is lit brightly;
the place it should go is lit faintly. Each is a warm pool **plus a rim** — a wash alone
disappears on pale grass, which is why the rim exists. A ring opens out of the destination
every couple of seconds so a still frame still reads. The sun, already the brightest thing
in the sky, gets the same rim rather than more brightness, because "brighter" says nothing
about the sun. This vocabulary is learned once in step one and then reused four times.

The earlier night version dimmed everything except the target. **That does not work in
daylight — it reads as a fault.** Do not reintroduce it.

**A suggestion must outlive the grab.** The moment someone picks something up is the moment
they most need to see where it goes, so holding something keeps the suggestion up: the glow
on the thing itself goes out (it is already in your hand) and the destination burns brighter
until it is actually dropped there. Fading the hint because "someone is clearly doing
something" was a real defect, not a style choice.

The dish keeps a dotted ring around it at all times, so it looks like somewhere things go
before anything is said. The two ends of the feeding step point at each other: picking up
the fish flares the dish's ring, and tapping the dish lights the fish. Tapping the dish is a
fair guess, not a mistake, and is answered rather than rebuffed.

## Interaction

Four of the five steps are drags: the cat out of the basket, the fish into the dish, the sun
into the notch, the cat back to bed. Grooming is the one tap — five taps flatten her fur,
and her fur going down is the only counter the step needs. She stays lit for the whole of
that step, because blinking the light off after each tap would blink it off five times.

**She is untidy, not frightened.** Raised hackles and shivering say "keep away", which is the
exact opposite of what the grooming step asks for, and first-time viewers read it as a
warning. She now shakes herself after her meal and ends up with five cowlicks on her head;
each stroke lays one flat. Do not go back to spikes.

**The sun step.** Nobody has seen a sun that can be dragged, and no amount of glow says
"downwards", so this step carries a **dotted orange arrow** from the sun to the notch for as
long as its suggestion is up. This is the one arrow in the piece and it breaks the rule
above on purpose: being unreadable is a worse failure than being less pure. It is warm
orange rather than the usual cream because cream on pale blue sky has almost no contrast,
and because it has to carry a direction rather than mark a spot. The sun also sinks towards
the notch on its own, and the sky goes gold over the notch, so the step still says something
before the arrow is read.

An earlier version had her tip her head back and watch the sky instead. At the sizes the
piece actually runs at, the tilt was a few pixels and nobody saw it; it was removed rather
than enlarged. Dragging was chosen over clicking
knowingly: clicking needs no teaching and dragging does, so **if a first-time tester stalls
on step one, the fix is to go back to click-to-walk**, which is still what `think()` does for
the walk/run modes.

Dropping something in the wrong place never fails. The cat simply stays where she is put, the
fish stays on the grass, and the sun floats back up with the morning following it.

## The scene

Day and night both exist now, and the fourth step is what moves between them: `S.night` runs
0 to 1 and is driven by the sun's height while you hold it, so the sky turns under your hand
rather than switching. There is a gap in the near treeline at the notch, so the destination
is a place rather than a smudge.

The horizon sits at 408 — a horizon at the vertical midpoint left the top half an empty
sky. The basket, dish, landing spot, fish, sun and notch are all measured off the frame
width, so the piece stays centred and reachable from a phone up to a desktop; a fixed layout
strands half of it offscreen. Her landing spot for step one is deliberately nowhere near the
dish, or she ends up standing on her own dinner.

Nothing drawn on the cat glows — she is a flat silhouette and the only true black in the
frame, day or night. Her raised fur is one zigzag along her back; separate lines read as a
hairbrush standing beside her.

Five dots across the top track the steps. This was added on request and reverses the earlier
rule against progress indicators — it does make the piece more legible and slightly more
like a checklist, and that trade was made deliberately.

Sound is synthesised with WebAudio on the spot, so the page stays one folder with no audio
files to fetch. It starts on the first touch, because browsers hold sound back until a
gesture. **Sound only ever confirms what the picture has already said** — a muted laptop,
which is what a classroom demo usually is, must lose nothing it needs to get through. M
mutes; there is deliberately no on-screen control, since that would be the one button in a
piece whose whole point is having none.

Saved defaults live in `js/config.js`; the "Field tuning" panel (`js/panel.js`) edits a live
copy of them and never writes to disk. `window.CATP` exposes `step()`, `skip()`, `reset()`
and the positions, which is what the Playwright tests drive.

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

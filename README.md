# Cat Naps — Night Shift

A wet back street under one sodium lamp, and a cat who sleeps wherever she ends up.

**Live:** https://zliu41-hash.github.io/IXD-107-sequential-interaction-prototype/

IXD 107 · Project 2, Sequential Interactions · Alice Liu · faculty: Samson Klitsner

---

## What it is

One scene. It never cuts away, there is no progress bar, nothing to complete and no way
to get it wrong. The sun and moon keep crossing whether or not anyone is watching, so the
piece is as much a window as a toy.

Three things you can do, and the cat decides what they mean:

| | you do | she does |
|---|---|---|
| **Startle** | press on her | wakes with a jolt, fur standing on end, whiskers out |
| **Carry** | drag her anywhere on the street | goes limp in the air, then stretches once and sleeps where you let go |
| **Coax** | drag the fish out and drop it | gets up, walks over, eats, and sleeps where she ate |

Each one leads into the next: she has to notice you before she will follow a fish, and she
only settles once she has nothing left to do. After dark she gets restless and moves herself.

## Running it

Open `index.html`. Nothing to build and no dependencies — one SVG, three scripts.

Press **T** (or add `#tools` to the address) for the **Street tuning** panel: light and
colour, the pace of the day, how wet the road is, how much she bristles, how far she wanders
after dark. *Copy settings* writes a prompt you can paste back into Claude Code to save the
values into `js/config.js`.

## Layout

```
index.html        the whole stage, as one SVG
css/style.css     palette, the phone frame, the panel
js/config.js      saved defaults — the only file the panel ever changes
js/app.js         the street, the cat, and what she does about you
js/panel.js       the tuning panel
studies/          the three Week 4 interaction studies, each standing alone
docs/week5/       screenshots across the day
```

## Week 4 studies

| study | quality | gesture |
|---|---|---|
| [01 · Startle](studies/01-startle/) | bristly | press |
| [02 · Sun and Moon](studies/02-sun-and-moon/) | drowsy | drag the sky |
| [03 · Anywhere](studies/03-anywhere/) | heavy | drag and let go |

Built grayscale, on purpose: they test behaviour before the final prototype gives it a palette.

## Notes on the design

The cat is the only true black in the frame. Everything else is light — the lamp's cone,
the pool it makes on wet asphalt, her reflection wobbling in it, the drizzle that only shows
where the light catches it. The palette is sodium orange against petrol blue, the two colours
a real street actually has at night, and it burns through orange at dawn and dusk.

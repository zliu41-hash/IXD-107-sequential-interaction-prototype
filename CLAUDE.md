# Project notes for Claude Code

This repository holds a static GitHub Pages prototype (`index.html` at the root) and the
three Week 4 interaction studies in `studies/`. Keep the study folders unchanged — they are
submitted separately and are deliberately grayscale.

The final prototype is **one continuous scene**. There are no screens to flip between, no
step tracker, no success or failure states, and nothing that ends. If a change would add a
sequence of pages, a progress indicator, or a check mark, it is the wrong change.

Saved defaults live in `js/config.js`; the "Street tuning" panel (`js/panel.js`) edits a live
copy of them and never writes to disk.

After changing anything in `js/` or `css/`, run `python3 stamp.py` before committing. It
rewrites the `?v=` token on the script and stylesheet tags from a hash of their contents, so
GitHub Pages can never hand someone a cached copy of the old code under the new HTML.

## How to ask questions

Use the AskUserQuestion tool for every question. Do not write questions as a list in your
reply. Ask one question at a time and wait for my answer before asking the next. For each
question, offer 2–4 suggested answers based on what you found in the studies. I can always
pick "Other" to type my own.

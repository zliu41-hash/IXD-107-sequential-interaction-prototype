#!/usr/bin/env python3
"""Rewrite the ?v= token on every script and stylesheet in index.html from a hash of
their contents, so a browser can never serve a stale copy of the prototype.
Run it after changing anything in js/ or css/, before committing."""
import re, pathlib, hashlib
FILES = ['js/app.js', 'js/config.js', 'js/panel.js', 'css/style.css']
stamp = hashlib.sha1(b''.join(pathlib.Path(f).read_bytes() for f in FILES)).hexdigest()[:8]
p = pathlib.Path('index.html'); s = p.read_text()
s = re.sub(r'(href="css/style\.css)(\?v=[0-9a-f]+)?"', rf'\1?v={stamp}"', s)
s = re.sub(r'(src="js/(?:config|app|panel)\.js)(\?v=[0-9a-f]+)?"', rf'\1?v={stamp}"', s)
p.write_text(s)
print('cache token:', stamp)

# POV: — Maison Malola

Concept website for POV: by Maison Malola, built on the scroll-story structure of the reference video
(sticky stage, one bottle, backdrop shifting from warm paper → vermilion → dark as you scroll).

    npm install
    npm run dev      # or the "malola-site" entry in ../.claude/launch.json (port 5201)
    npm run build    # static site in dist/, relative paths

- Copy, product names and photos come from the brand's Instagram (@pov.maisonmalola); raw downloads live in `raw/ig/` (kept local, not committed).
- The bottle on the stage is the Vision cutout of their manifesto photo, split into blend layers by
  `scripts/bottle-layers.py` (glass = multiply, rim = screen, cap, juice mask). The labels are HTML, so they swap per scent.
- Orders go to WhatsApp (wa.me/916282771001) with the scent prefilled.
- `scripts/shots.mjs` takes headless Chrome screenshots at scroll positions, for checking the scrubbed story.

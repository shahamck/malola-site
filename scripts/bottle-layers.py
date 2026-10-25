# Rebuilds the bottle from the brand's manifesto photo as layers the page can blend over any backdrop.
# The silhouette is a clean, symmetric profile measured off the Vision cutout (its own edge is lumpy),
# and the glass keeps only the photo's detail, not the paper behind it, so it reads as clear glass anywhere.
#   glass  — multiply: dark glass detail + edge thickness
#   light  — screen: highlights + rim, shown on dark scenes
#   cap    — the wooden cap, drawn normally
#   body   — alpha mask of the inner glass, for tinting the juice per scent
# Usage: python3 scripts/bottle-layers.py raw/ig/09-DYPiNX2TWAH.jpg public/img
import sys
import numpy as np
from PIL import Image, ImageFilter

src_path, out = sys.argv[1:3]
K = 2                                          # output scale vs the photo
X0, Y0, X1, Y1 = 422, 262, 702, 962           # crop in photo px (bottle + padding)
LABEL = (505, 575, 690, 758)                   # printed label, x0 y0 x1 y1 (the page draws its own)
CAP = (277, 452)                               # cap top / bottom rows

def axis(y):
    """The photo is shot slightly from above, so the axis drifts a few px from cap to base."""
    return float(np.interp(y, [272, 452, 488, 900], [564.5, 564.5, 562, 559.5]))

def half_width(y):
    """Half the bottle's width at photo row y (floats), 0 outside."""
    if y < CAP[0] or y > 952: return 0.0
    if y <= CAP[1]:                            # cap, rounded top corners
        w, r = 81.0, 14.0
        d = y - CAP[0]
        return w - r + np.sqrt(max(r * r - (r - d) ** 2, 0)) if d < r else w
    if y <= 488:                               # neck under the cap
        t = (y - CAP[1]) / (488 - CAP[1])
        return 76 - 8 * np.sin(np.pi * t) + 8 * max(t - .75, 0) / .25
    if y <= 553:                               # shoulder
        t = (y - 488) / (553 - 488)
        return 86 + 43 * np.sin(t * np.pi / 2) ** .8
    r = 22.0                                   # body, rounded base
    d = 952 - y
    return 129 - r + np.sqrt(max(r * r - (r - d) ** 2, 0)) if d < r else 129.0

# silhouette, supersampled for a clean anti-aliased edge
SS = 4
H, W = (Y1 - Y0) * K, (X1 - X0) * K
ys = Y0 + (np.arange(H * SS) + .5) / (K * SS)
xs = X0 + (np.arange(W * SS) + .5) / (K * SS)
hw = np.array([half_width(y) for y in ys])
cx = np.array([axis(y) for y in ys])
big = (np.abs(xs[None, :] - cx[:, None]) <= hw[:, None]).astype(float)
cap_big = big * (ys[:, None] <= CAP[1])
def down(m): return m.reshape(H, SS, W, SS).mean((1, 3))
mask, cap_mask = down(big), down(cap_big)
glass_mask = np.clip(mask - cap_mask, 0, 1)

# photo, upscaled to the output grid
photo = Image.open(src_path).convert('RGB').crop((X0, Y0, X1, Y1)).resize((W, H), Image.LANCZOS)
src = np.array(photo).astype(float)
lum = src @ [.299, .587, .114]
def blur(a, r):
    """Float gaussian-ish blur: three box passes per axis."""
    w = int(round(np.sqrt(12 * r * r / 3 + 1)))
    for axis in (0, 1):
        for _ in range(3):
            pad = [(0, 0), (0, 0)]; pad[axis] = (w // 2, w - 1 - w // 2)
            c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
            c = np.insert(c, 0, 0, axis=axis)
            a = (np.take(c, range(w, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - w), axis=axis)) / w
    return a
# glass-only low-pass (normalised), so the dark cap and the paper outside don't bleed into the glass tone
low = blur(lum * glass_mask, 18 * K) / np.maximum(blur(glass_mask, 18 * K), 1e-3)
PAPER = 233.0
detail = lum / np.maximum(low, 1)              # the glass's own lines, shading removed
weight = (low / PAPER) ** .35                  # keep a little of the glass's body tone

# edge thickness: a soft band just inside the silhouette
inner = np.array(Image.fromarray((glass_mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(2 * K))) / 255
edge = np.clip(glass_mask - inner, 0, 1)

lx0, ly0, lx1, ly1 = [(v - o) * K for v, o in zip(LABEL, (X0, Y0, X0, Y0))]
under_label = np.zeros_like(mask); under_label[ly0:ly1, lx0:lx1] = 1

dark = np.clip(np.minimum(detail, 1) * weight, 0, 1) * (1 - .28 * edge)
dark = np.where(under_label > 0, 1, dark)
light = np.clip((detail - 1) * 3.2, 0, 1) * .9 + edge * .55 + np.clip((1 - detail) * 1.4, 0, 1) * .35
light = np.where(under_label > 0, 0, np.clip(light, 0, 1))

def save(gray_or_rgb, a, name):
    rgb = gray_or_rgb if gray_or_rgb.ndim == 3 else np.dstack([gray_or_rgb] * 3)
    img = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    Image.fromarray(img).save(f'{out}/bottle-{name}.webp', quality=92)

save(dark * 255, glass_mask, 'glass')
save(np.full_like(light, 255), light * glass_mask, 'light')
save(src, cap_mask, 'cap')
body = Image.fromarray((glass_mask * (np.arange(H)[:, None] / K + Y0 > 505) * 255).astype(np.uint8))
body = np.array(body.filter(ImageFilter.MinFilter(11)).filter(ImageFilter.GaussianBlur(3 * K))) / 255
save(np.full_like(body, 255), body, 'body')
print('wrote', W, 'x', H)

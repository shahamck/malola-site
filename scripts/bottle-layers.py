# Splits the Vision cutout of the bottle into layers the page can blend over any background:
#   glass  — multiply layer (photo / paper colour), so the backdrop shows through the clear glass
#   rim    — screen layer (the glass's dark detail inverted), lights the edges up on dark scenes
#   cap    — the wooden cap + collar, drawn normally
#   body   — alpha mask of the inner glass, for tinting the juice per scent
# Usage: python3 scripts/bottle-layers.py raw/ig/09-DYPiNX2TWAH.jpg raw/09-DYPiNX2TWAH-cut.png public/img
import sys
import numpy as np
from PIL import Image, ImageFilter

src_path, cut_path, out = sys.argv[1:4]
src = np.array(Image.open(src_path).convert('RGB')).astype(float)
alpha = np.array(Image.open(cut_path))[..., 3].astype(float)

X0, Y0, X1, Y1 = 422, 262, 702, 962          # bottle bbox (432,270)-(692,952) + padding
LABEL = (505, 575, 690, 758)                   # printed label, x0 y0 x1 y1
CAP_END = 462                                 # last row of the wooden cap / collar
PAPER = np.array([236, 230, 222.0])

src, alpha = src[Y0:Y1, X0:X1], alpha[Y0:Y1, X0:X1]
h, w = alpha.shape
cap_rows = (np.arange(h) + Y0 <= CAP_END)[:, None].repeat(w, 1)

def save(rgb, a, name):
    img = np.dstack([np.clip(rgb, 0, 255), np.clip(a, 0, 255)]).astype(np.uint8)
    Image.fromarray(img).save(f'{out}/{name}.png')

ratio = np.clip(src / PAPER, 0, 1)
ly, lx = slice(LABEL[1] - Y0, LABEL[3] - Y0), slice(LABEL[0] - X0, LABEL[2] - X0)
ratio[ly, lx] = 1                             # the HTML label covers this; drop the printed one
glass_a = np.where(cap_rows, 0, alpha)
save(ratio * 255, glass_a, 'bottle-glass')

lum = 1 - ratio.mean(2)
rim = np.clip(lum * 2.4, 0, 1) * 255
rim_a = glass_a.copy()
rim_a[ly, lx] = 0
save(np.dstack([rim, rim * 0.97, rim * 0.93]), rim_a, 'bottle-rim')

save(src, np.where(cap_rows, alpha, 0), 'bottle-cap')

body = Image.fromarray(np.where(cap_rows, 0, alpha).astype(np.uint8)).filter(ImageFilter.MinFilter(15))
body = body.filter(ImageFilter.GaussianBlur(4))
body_a = np.array(body).astype(float)
body_a[: 500 - Y0] = 0                        # juice starts below the shoulder
save(np.full((h, w, 3), 255.0), body_a, 'bottle-body')
print('size', w, h)

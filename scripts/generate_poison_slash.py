"""Generate the rogue's transparent poison slash from the warrior VFX.

Run with Python + Pillow: python scripts/generate_poison_slash.py
"""
from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/assets/VFX/basic slashs/Basic Slash 1/orange/GIF.gif'
OUTPUT = ROOT / 'src/assets/VFX/poison-slash.gif'


def generate():
    rng = random.Random(17)
    droplets = [(rng.uniform(25, 103), rng.uniform(25, 92), rng.uniform(0, math.tau))
                for _ in range(14)]
    frames = []
    with Image.open(SOURCE) as source:
        for index, original in enumerate(ImageSequence.Iterator(source)):
            frame = original.convert('RGBA')
            # Preserve the slash silhouette and highlights, shifting orange to toxic green.
            pixels = []
            for red, green, blue, alpha in frame.getdata():
                brightness = max(red, green, blue)
                pixels.append((int(brightness * 0.35), brightness,
                               int(brightness * 0.15), alpha))
            frame.putdata(pixels)
            draw = ImageDraw.Draw(frame)
            if 1 <= index <= 7:
                for x, y, angle in droplets:
                    x += math.cos(angle) * index * 2
                    y += math.sin(angle) * index * 2 + index
                    radius = 2 if index < 5 else 1
                    draw.ellipse((x - radius, y - radius, x + radius, y + radius),
                                 fill=(116, 235, 36, 255))
            # Reserve index 255 for transparency; disposal=2 prevents ghost trails.
            palette_frame = frame.convert('RGB').quantize(colors=255)
            palette_frame.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
            palette_frame.info['transparency'] = 255
            frames.append(palette_frame)
    frames[0].save(OUTPUT, save_all=True, append_images=frames[1:], duration=100,
                   loop=0, transparency=255, disposal=2, optimize=False)
    print(f'Generated {OUTPUT.name}: {len(frames)} frames, 900 ms, transparent')


if __name__ == '__main__':
    generate()

"""Prepare lightweight UI copies; keep the generated originals untouched.

Run with Python and Pillow: python scripts/prepare-hotkey-icons.py
"""
from pathlib import Path
from PIL import Image

source = Path(__file__).resolve().parents[1] / 'src/assets/ui/hotkeys'
output = source / 'display'
output.mkdir(exist_ok=True)
for key in ['q', 'w', 'e', 'r', 't', '1', '2', '3', '4', '5', '6']:
    image = Image.open(source / f'key-{key}.png').convert('RGBA')
    bounds = image.getchannel('A').point(lambda value: 255 if value >= 32 else 0).getbbox()
    if bounds:
        image = image.crop(bounds)
    image.thumbnail((60, 60), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (64, 64))
    canvas.alpha_composite(image, ((64 - image.width) // 2, (64 - image.height) // 2))
    canvas.save(output / f'key-{key}.png', optimize=True)
    print(f'Prepared key-{key}.png (64x64)')

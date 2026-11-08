"""Import the supplied potion art and animate both forest NPC sprite sheets.

Requires Pillow. Run: python scripts/import_new_assets.py
Use --preview to create a numbered potion contact sheet in the approved temp folder.
"""
from pathlib import Path
import argparse
import struct

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'new-assets'
NPC_SOURCE = SOURCE / 'TheForestCharacterPack2_FreeVersion/TheForestCharacterPack2_FreeVersion'
NPC_OUTPUT = ROOT / 'src/assets/sprites/npcs'
POTIONS = {
    'healing-flask': 59,
    'energy-flask': 204,
    'healing-potion': 60,
    'energy-tonic': 206,
    'antidote': 176,
}


def animate(character, filename):
    data = (NPC_SOURCE / f'{character}.aseprite').read_bytes()
    count, width, height = struct.unpack_from('<HHH', data, 6)
    durations = []
    offset = 128
    for _ in range(count):
        size, magic, chunks, duration = struct.unpack_from('<IHHH', data, offset)
        assert magic == 0xF1FA, 'Invalid Aseprite frame'
        durations.append(max(20, duration))
        offset += size
    sheet = Image.open(NPC_SOURCE / f'{character}_spritesheet.png').convert('RGBA')
    columns = sheet.width // width
    assert sheet.width % width == 0 and sheet.height % height == 0
    assert columns * (sheet.height // height) == count
    frames = []
    for index in range(count):
        x, y = index % columns * width, index // columns * height
        frame = sheet.crop((x, y, x + width, y + height)).resize((width * 4, height * 4), Image.Resampling.NEAREST)
        indexed = frame.convert('RGB').quantize(colors=255)
        indexed.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        indexed.info['transparency'] = 255
        frames.append(indexed)
    frames[0].save(NPC_OUTPUT / filename, save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, transparency=255, disposal=2, optimize=False)
    frames[0].save(NPC_OUTPUT / filename.replace('.gif', '.png'), transparency=255)
    print(f'{filename}: {count} frames, {width}x{height}, durations={durations}')


def preview():
    files = sorted((SOURCE / 'potions').glob('*.png'), key=lambda p: int(p.stem.removeprefix('potion')))
    columns, cell = 14, 72
    canvas = Image.new('RGB', (columns * cell, ((len(files) + columns - 1) // columns) * cell), '#252a29')
    draw = ImageDraw.Draw(canvas)
    for index, file in enumerate(files):
        icon = Image.open(file).convert('RGBA')
        icon.thumbnail((40, 40), Image.Resampling.NEAREST)
        icon = icon.resize((40, 40), Image.Resampling.NEAREST)
        x, y = index % columns * cell, index // columns * cell
        canvas.paste(icon, (x + 16, y + 4), icon)
        draw.text((x + 22, y + 48), file.stem.removeprefix('potion'), fill='white')
    output = Path(r'C:\Users\Trefu\AppData\Local\Temp\opencode\potion-preview.png')
    canvas.save(output)
    print(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    if args.preview:
        preview()
    else:
        animate('Character1', 'forest-merchant.gif')
        animate('Character2', 'forest-wanderer.gif')
        for name, number in POTIONS.items():
            Image.open(SOURCE / f'potions/potion{number}.png').convert('RGBA').save(
                ROOT / f'src/assets/icons/potions/{name}.png')
            print(f'{name}.png <- potion{number}.png')

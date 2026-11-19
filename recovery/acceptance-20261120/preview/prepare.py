"""Build an isolated acceptance Preview from the previously verified archives."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw

PREVIEW = Path(__file__).resolve().parent
RECOVERY = PREVIEW.parents[1]
OVERLAYS = PREVIEW.parent
PRIOR_BUILDER = RECOVERY / 'function-20261120' / 'preview' / 'prepare.py'


def hash_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify(path, expected):
    if hash_file(path) != expected:
        raise ValueError(f'SHA-256 mismatch: {path}')


def apply_overlay(site, name):
    checks = json.loads((OVERLAYS / f'{name}.sha256.json').read_text())
    for filename, hashes in checks.items():
        verify(site / filename, hashes['before'])
    subprocess.run(['git', 'apply', '--unidiff-zero', str(OVERLAYS / f'{name}.patch')], cwd=site, check=True)
    for filename, hashes in checks.items():
        verify(site / filename, hashes['after'])


def make_fixtures(output):
    qa = output / 'qa'
    colors = [(211, 30, 26), (26, 148, 55), (34, 72, 222), (205, 38, 176), (16, 156, 191), (242, 130, 19)]
    sizes = [(240, 110), (110, 240), (180, 180)]
    for index, color in enumerate(colors):
        width, height = sizes[index % len(sizes)]
        image = Image.new('RGB', (width, height), 'white')
        ImageDraw.Draw(image).rectangle((6, 6, width - 7, height - 7), fill=color)
        image.save(qa / f'tile-{index + 1}.png')
    warning = Image.new('RGB', (400, 240), '#fff3cd')
    ImageDraw.Draw(warning).text((22, 110), 'PREVIEW ONLY - NO PAYMENT', fill='#401c0b')
    warning.save(qa / 'no-payment.png')


def prepare(args):
    output = args.output.resolve()
    command = [sys.executable, str(PRIOR_BUILDER), args.stable_zip, args.print_zip, args.canvas, args.pdf, output]
    subprocess.run(command, check=True)
    stable, printing = output / 'stable', output / 'print'
    if args.with_control:
        shutil.copytree(stable, output / 'stable-before')
    apply_overlay(printing, 'print-draft')
    apply_overlay(stable, 'quote-upload')
    apply_overlay(stable, 'inventory-import')
    for source, name, expected in (
        (args.xlsx, 'xlsx.full.min.js', 'cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41'),
        (args.scanner, 'html5-qrcode.min.js', '660b12437b1d747e3e68b8be0685c08cb728140110ad213f167b14b66f8b1d8e'),
    ):
        verify(source, expected)
        shutil.copyfile(source, output / 'qa' / name)
    make_fixtures(output)
    for name in ('stable', 'print', 'stable-before'):
        if (output / name).is_dir():
            shutil.copyfile(output / 'qa' / 'no-payment.png', output / name / 'vietqr-payment.png')
    for name in ('acceptance.py', 'qa/acceptance.html', 'qa/acceptance.js'):
        shutil.copyfile(PREVIEW / name, output / name)
    (output / 'package.json').write_text(json.dumps({'private': True, 'scripts': {'dev': 'python -u acceptance.py'}}))
    home = output / 'index.html'
    text = home.read_text().replace('<p id="result"', '<p><a href="/qa/acceptance.html">Mở bảng nghiệm thu mở rộng</a></p><p id="result"')
    home.write_text(text)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    for key in ('stable_zip', 'print_zip', 'canvas', 'pdf', 'xlsx', 'scanner', 'output'):
        parser.add_argument(key, type=Path)
    parser.add_argument('--with-control', action='store_true')
    prepare(parser.parse_args())

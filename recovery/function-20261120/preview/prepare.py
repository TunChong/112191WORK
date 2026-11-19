"""Assemble the two exact QA candidates in an empty local directory."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile

from PIL import Image, ImageDraw


PREVIEW = Path(__file__).resolve().parent
PATCHES = PREVIEW.parent
REPO = PATCHES.parents[1]
HTTP = PATCHES.parent / 'http-20261120'
PRINT_REF = '67bc22abab6f7893cda677a263333e295d5c93dc:releases/companion-mwg-v3.6.0-preview-ui11-video-review/'
FIXTURE_CONFIG = "window.WORK_CONFIG={supabaseUrl:location.origin+'/qa-api',supabasePublishableKey:'qa-only-fictional-key'};\n"


def check(data, expected, label):
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f'Unexpected SHA-256: {label}')


def git_print_file(path):
    return subprocess.check_output(['git', 'show', PRINT_REF + path], cwd=REPO)


def unpack(archive, expected, output):
    check(archive.read_bytes(), expected, archive)
    with ZipFile(archive) as pack:
        pack.extractall(output)


def apply_overlay(site, name):
    checks = json.loads((PATCHES / f'{name}.sha256.json').read_text())
    for filename, hashes in checks.items():
        check((site / filename).read_bytes(), hashes['before'], filename)
    subprocess.run(['git', 'apply', '--unidiff-zero', str(PATCHES / f'{name}.patch')], cwd=site, check=True)
    for filename, hashes in checks.items():
        check((site / filename).read_bytes(), hashes['after'], filename)


def prepare(stable_zip, print_zip, canvas, pdf, output):
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError('Preview output directory must be empty')
    stable, printing = output / 'stable', output / 'print'
    unpack(stable_zip, 'd628ef44144159e17e42cc65ca98096432383b43179dd6af023b1ef732e010a6', stable)
    unpack(print_zip, '596463522391497034ba8f62aa21dfe12a94a16a550f5ca534e34e339449513d', printing)
    http = json.loads((HTTP / 'manifest.json').read_text())
    for name, expected in http['candidate_sha256'].items():
        check((stable / name).read_bytes(), http['baseline_sha256'][name], name)
        data = (HTTP / 'source' / name).read_bytes()
        check(data, expected, name)
        (stable / name).write_bytes(data)
    print_hashes = json.loads(git_print_file('SHA256SUMS.json'))
    for name in ('index.html', 'sw.js', 'mwgx/print_engine.js', 'mwgx/print_studio.js', 'mwgx/style.css'):
        data = git_print_file('patch/modules/' + name)
        check(data, print_hashes['modules/' + name], name)
        target = printing / ('modules/' + name if '/' in name else name)
        target.write_bytes(data)
    apply_overlay(stable, 'stable-quote')
    apply_overlay(printing, 'print-ui11')
    for site in (stable, printing):
        (site / 'config.js').write_text(FIXTURE_CONFIG)
    for name in ('index.html', 'package.json', 'serve.py', 'qa/suite.js'):
        (output / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(PREVIEW / name, output / name)
    for path, name, expected in (
        (canvas, 'html2canvas.min.js', 'e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb'),
        (pdf, 'jspdf.umd.min.js', '85ba2cc3ff858a20fa49fe6e457bec863ea40b55a9f3725e58a940e62f6f61a4'),
    ):
        data = path.read_bytes()
        check(data, expected, path)
        (output / 'qa' / name).write_bytes(data)
    marker = Image.new('RGB', (200, 200), 'white')
    ImageDraw.Draw(marker).rectangle((20, 20, 179, 179), fill=(220, 0, 160))
    marker.save(output / 'qa' / 'marker.png')


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    for arg in ('stable_zip', 'print_zip', 'canvas', 'pdf', 'output'):
        cli.add_argument(arg, type=Path)
    args = cli.parse_args()
    prepare(args.stable_zip, args.print_zip, args.canvas, args.pdf, args.output.resolve())

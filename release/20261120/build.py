"""Build the static Cloudflare Pages release from the delivered backup and this overlay."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import zipfile

RELEASE = Path(__file__).resolve().parent
BACKUP_NAME = 'BACKUP-COMPANION-MWG.zip'
OUTPUT_NAME = 'COMPANION-MWG-PRODUCTION.zip'


def checksums(files):
    return {name: sha256(data).hexdigest() for name, data in files.items()}


def build(backup, output):
    manifest = json.loads((RELEASE / 'sha256.json').read_text())
    if sha256(backup.read_bytes()).hexdigest() != manifest['archives_sha256'][BACKUP_NAME]:
        raise ValueError('Use the versioned backup delivered with this release.')
    with zipfile.ZipFile(backup) as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    if checksums(files) != manifest['backup']:
        raise ValueError('Backup file hashes do not match the release manifest.')

    overlay = RELEASE / 'overlay'
    for path in overlay.rglob('*'):
        if path.is_file():
            files[path.relative_to(overlay).as_posix()] = path.read_bytes()
    if checksums(files) != manifest['release']:
        raise ValueError('Release file hashes do not match. Check the Git checkout and line endings.')

    with zipfile.ZipFile(output, 'x', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 11, 20, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    if sha256(output.read_bytes()).hexdigest() != manifest['archives_sha256'][OUTPUT_NAME]:
        raise ValueError('ZIP bytes differ from the release archive. Deployable file hashes match.')
    print(f'{output}: {len(files)} files')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('backup', type=Path)
    parser.add_argument('--output', type=Path, default=Path(OUTPUT_NAME))
    arguments = parser.parse_args()
    build(arguments.backup, arguments.output)

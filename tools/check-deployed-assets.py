"""Compare every release asset with its bytes served by the public Worker."""
import concurrent.futures
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = sys.argv[1].rstrip('/')
MANIFEST = Path(sys.argv[2])
OUTPUT = Path(sys.argv[3])
manifest = json.loads(MANIFEST.read_text())['manifest']


def verify(entry):
    path, expected = entry
    local = (ROOT / 'dist' / path.lstrip('/')).read_bytes()
    expected_sha = hashlib.sha256(local).hexdigest()
    for attempt in range(3):
        try:
            # The host's Browser Integrity Check rejects Python's default client.
            # Native curl can read the same public files as the browser.
            response = subprocess.run([
                'curl', '--fail', '--silent', '--show-error', '--location',
                '--max-time', '30', '--header', 'Accept-Encoding: identity',
                '--header', 'Cache-Control: no-cache',
                '--write-out', '%{stderr}%{json}', BASE + path,
            ], capture_output=True, check=True)
            body = response.stdout
            metadata = json.loads(response.stderr)
            actual_sha = hashlib.sha256(body).hexdigest()
            return {
                'path': path, 'status': metadata['http_code'], 'bytes': len(body),
                'contentType': metadata['content_type'],
                'sha256': actual_sha, 'expectedSha256': expected_sha,
                'matches': actual_sha == expected_sha and len(body) == expected['size'],
            }
        except Exception as error:
            if attempt == 2:
                return {'path': path, 'matches': False, 'error': str(error)}
            time.sleep(attempt + 1)


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    checks = list(executor.map(verify, manifest.items()))
report = {
    'base': BASE,
    'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'files': len(checks), 'matching': sum(check['matches'] for check in checks),
    'checks': checks,
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({key: report[key] for key in ['base', 'sourceCommit', 'files', 'matching']}))
if report['matching'] != report['files']:
    raise SystemExit('Public assets differ from the verified release.')

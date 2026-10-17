"""Read-only, zero-network Synera source inventory. Never emits key values.

This is a bounded source check, not a secret scanner for Git history, binary
files, deployed services, or skipped sparse-checkout paths.
"""
import argparse
import collections
import json
import plistlib
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'google_api_key': re.compile(r'AIza[A-Za-z0-9_-]{35}'),
    'provider_secret_candidate': re.compile(r'\bsk-[A-Za-z0-9_-]{20,}'),
    'github_token_candidate': re.compile(r'\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}'),
    'private_key_marker': re.compile(r'-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----'),
}
TEXT_SUFFIXES = {'.dart', '.js', '.json', '.yaml', '.yml', '.xml', '.plist',
                 '.gradle', '.properties', '.html', '.swift', '.kt', '.rules', '.md'}
GENERATED_PARTS = {'.dart_tool', 'build', '.idea', '.gradle', 'node_modules', 'Pods'}

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args]).decode('utf-8')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def line_of(text, needle):
    pos = text.find(needle)
    return None if pos < 0 else text.count('\n', 0, pos) + 1

def audit():
    tracked = [p for p in git('ls-files', '-z').split('\0') if p]
    generated = [p for p in tracked if GENERATED_PARTS.intersection(Path(p).parts)]
    skipped, findings, scanned = [], [], 0
    unique = collections.defaultdict(set)
    for relative in tracked:
        path = ROOT / relative
        if not path.is_file() or GENERATED_PARTS.intersection(path.relative_to(ROOT).parts):
            skipped.append(relative)
            continue
        if path.suffix not in TEXT_SUFFIXES or path.stat().st_size > 2_000_000:
            continue
        try:
            content = path.read_text(encoding='utf-8')
        except UnicodeError:
            continue
        scanned += 1
        for kind, pattern in PATTERNS.items():
            for hit in pattern.finditer(content):
                unique[kind].add(hit.group())
                findings.append({'kind': kind, 'path': relative,
                                 'line': content.count('\n', 0, hit.start()) + 1})
    browser_files = [p for p in tracked if 'chrome-device' in p and
                     Path(p).name in {'Cookies', 'Login Data', 'History', 'Web Data'}]
    android = json.loads(read('crystallised_in/android/app/google-services.json'))
    ios = plistlib.loads((ROOT / 'crystallised_in/ios/Runner/GoogleService-Info.plist').read_bytes())
    web = read('crystallised_in/lib/backend/firebase/firebase_config.dart')
    web_project = re.search(r'projectId:\s*[\'"]([^\'"]+)', web).group(1)
    gradle = read('crystallised_in/android/app/build.gradle')
    package = re.search(r'applicationId\s+[\'"]([^\'"]+)', gradle).group(1)
    android_packages = [client['client_info']['android_client_info']['package_name']
                        for client in android['client']]
    rules = read('crystallised_in/firebase/firestore.rules')
    functions = []
    for relative in tracked:
        if relative.startswith('crystallised_in/firebase/custom_cloud_functions/') and relative.endswith('.js') and not relative.endswith('/index.js'):
            code = read(relative)
            functions.append({'path': relative, 'has_on_request': 'https.onRequest' in code,
                              'has_verify_id_token': 'verifyIdToken' in code,
                              'has_admin_firestore': 'admin.firestore()' in code or bool(re.search(r'admin\s*\.firestore\(', code))})
    result = {
        'source_commit': git('rev-parse', 'HEAD').strip(),
        'network_calls': 0, 'provider_calls': 0, 'secret_values_emitted': False,
        'scope': 'checked-out tracked text source up to 2MB; metadata for all tracked paths; no history or binary content scan',
        'tracked_files': len(tracked), 'text_files_scanned': scanned,
        'tracked_generated_files': len(generated), 'skipped_or_absent_files': len(skipped),
        'browser_profile_paths': browser_files,
        'credential_candidate_locations': findings,
        'distinct_candidate_counts': {kind: len(values) for kind, values in unique.items()},
        'firebase_projects_match_across_web_android_ios': len({web_project, android['project_info']['project_id'], ios['PROJECT_ID']}) == 1,
        'android_application_id_matches_firebase_client': package in android_packages,
        'legacy_application_root': 'crystallised_in',
        'nested_counter_app': 'Flutter Demo Home Page' in read('crystallised_in/android/lib/main.dart'),
        'rules_unconditional_write_lines': [i for i, line in enumerate(rules.splitlines(), 1) if 'allow write: if true' in line],
        'rules_unconditional_read_lines': [i for i, line in enumerate(rules.splitlines(), 1) if 'allow read: if true' in line],
        'custom_function_auth_markers': functions,
        'live_key_status': 'NOT_CHECKED', 'cloud_account_access': 'NOT_CHECKED',
        'deployed_rules': 'NOT_CHECKED', 'flutter_runtime': 'NOT_TESTED',
    }
    return result

def self_check():
    synthetic = 'sk-' + 'x' * 24
    google = 'AIza' + 'x' * 35
    assert PATTERNS['provider_secret_candidate'].search(synthetic)
    assert PATTERNS['google_api_key'].search(google)
    # The serialized location record has no token, prefix, suffix, or digest.
    record = {'kind': 'provider_secret_candidate', 'path': 'synthetic.dart', 'line': 1}
    assert synthetic not in json.dumps(record)
    assert line_of('a\nb\nc', 'b') == 2

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    self_check()
    report = audit()
    rendered = json.dumps(report, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding='utf-8')
    print(rendered)

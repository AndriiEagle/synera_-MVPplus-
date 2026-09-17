"""ADP-07 reference implementation: versioned product surface configuration.

The point of ADP-07 is that re-shaping the product under market feedback should
be a configuration revision, not a rewrite. The hard part is not the config
format - it is the interaction with P04 (immutable agreed revisions) and P15
(old exports round-trip, no second durable store).

This file implements the classification rule and proves the invariants on
synthetic data. It is a specification example, not production code, and it
introduces no storage of its own.

    python -B adp07_surface_config.py
"""
import copy
import json
import sys

# P04 acceptance names exactly these as agreed content. A change to any of
# them resets both acceptances; cosmetic UI outside agreed content does not.
AGREED_CONTENT_FIELDS = {
    'scope', 'out_of_scope', 'deadlines', 'compensation',
    'acceptance', 'ip', 'confidentiality', 'termination',
}

PRESENTATION = 'PRESENTATION'
SURFACE_ADDITIVE = 'SURFACE_ADDITIVE'
MATERIAL = 'MATERIAL'
REMOVAL = 'REMOVAL'
RANK = {PRESENTATION: 0, SURFACE_ADDITIVE: 1, REMOVAL: 2, MATERIAL: 3}

ALLOWED_TOP_LEVEL = {'config_version', 'modes', 'fields', 'flow', 'copy', 'retired'}
ALLOWED_FIELD_KEYS = {'label', 'required', 'agreed_content', 'kind', 'order', 'density'}


class ConfigError(ValueError):
    pass


# --------------------------------------------------------------------------
# Validation. Allowlist only; unknown keys are rejected rather than ignored,
# following the same rule the V6-03 contract states for patch schemas.
# --------------------------------------------------------------------------

def validate(cfg):
    unknown = set(cfg) - ALLOWED_TOP_LEVEL
    if unknown:
        raise ConfigError(f'unknown top-level keys: {sorted(unknown)}')
    if not isinstance(cfg.get('config_version'), int) or cfg['config_version'] < 1:
        raise ConfigError('config_version must be a positive integer')
    if 'store' in cfg or 'database' in cfg or 'storage' in cfg:
        raise ConfigError('configuration must not declare its own store (P15: no second durable store)')
    for name, spec in cfg.get('fields', {}).items():
        bad = set(spec) - ALLOWED_FIELD_KEYS
        if bad:
            raise ConfigError(f'field {name}: unknown keys {sorted(bad)}')
        if spec.get('agreed_content') and name not in AGREED_CONTENT_FIELDS:
            raise ConfigError(f'field {name} claims agreed_content but is not one of the P04 fields')
        if name in AGREED_CONTENT_FIELDS and not spec.get('agreed_content'):
            raise ConfigError(f'field {name} is P04 agreed content and cannot be marked otherwise')
    for m in cfg.get('modes', []):
        if m not in {'exchange', 'paid_service', 'referral', 'hybrid', 'joint_project'}:
            raise ConfigError(f'unknown collaboration mode: {m}')
    return True


# --------------------------------------------------------------------------
# Change classification. This is the whole contract in one function.
# --------------------------------------------------------------------------

def classify_change(old, new):
    """Return (highest_class, per_change_list)."""
    changes = []

    old_fields, new_fields = old.get('fields', {}), new.get('fields', {})

    for name in sorted(set(new_fields) - set(old_fields)):
        cls = MATERIAL if new_fields[name].get('agreed_content') else SURFACE_ADDITIVE
        changes.append((cls, f'field added: {name}'))

    for name in sorted(set(old_fields) - set(new_fields)):
        if name in new.get('retired', []):
            changes.append((REMOVAL, f'field retired: {name}'))
        else:
            raise ConfigError(
                f'field {name} removed without being listed in "retired"; '
                f'P15 requires old exports to round-trip')

    for name in sorted(set(old_fields) & set(new_fields)):
        o, n = old_fields[name], new_fields[name]
        for key in sorted(set(o) | set(n)):
            if o.get(key) == n.get(key):
                continue
            if key in ('order', 'density'):
                changes.append((PRESENTATION, f'{name}.{key}'))
            elif key == 'label':
                cls = MATERIAL if n.get('agreed_content') else PRESENTATION
                changes.append((cls, f'{name}.label'))
            elif key == 'required' and n.get('agreed_content'):
                changes.append((MATERIAL, f'{name}.required'))
            else:
                changes.append((MATERIAL if n.get('agreed_content') else SURFACE_ADDITIVE,
                                f'{name}.{key}'))

    for m in sorted(set(new.get('modes', [])) - set(old.get('modes', []))):
        changes.append((SURFACE_ADDITIVE, f'mode added: {m}'))
    for m in sorted(set(old.get('modes', [])) - set(new.get('modes', []))):
        changes.append((REMOVAL, f'mode retired: {m}'))

    for k in sorted(set(old.get('copy', {})) | set(new.get('copy', {}))):
        if old.get('copy', {}).get(k) != new.get('copy', {}).get(k):
            changes.append((PRESENTATION, f'copy.{k}'))

    if old.get('flow') != new.get('flow'):
        changes.append((SURFACE_ADDITIVE, 'flow'))

    if not changes:
        return PRESENTATION, []
    highest = max((c for c, _ in changes), key=lambda c: RANK[c])
    return highest, changes


# --------------------------------------------------------------------------
# Applying a new configuration to cases. A case pins the config version it was
# agreed under; that pin is what keeps P04 true while the surface moves.
# --------------------------------------------------------------------------

def apply_config(cases, old_cfg, new_cfg):
    """Returns (updated_cases, report). Never mutates the input."""
    if new_cfg['config_version'] <= old_cfg['config_version']:
        raise ConfigError('a new surface configuration must raise config_version')
    highest, changes = classify_change(old_cfg, new_cfg)
    cases = copy.deepcopy(cases)
    reset = []
    for case in cases:
        if case['status'] == 'agreed':
            # An agreed case keeps rendering under its pinned version. Nothing
            # about it changes, whatever class the change is.
            continue
        if highest == MATERIAL:
            case['approvals'] = {}
            case['pinned_config_version'] = new_cfg['config_version']
            reset.append(case['case_id'])
        else:
            case['pinned_config_version'] = new_cfg['config_version']
    return cases, {'class': highest, 'changes': changes, 'approvals_reset': reset}


def export_case(case, cfg_by_version):
    """Export uses the case's pinned version, not the current one."""
    cfg = cfg_by_version[case['pinned_config_version']]
    known = set(cfg.get('fields', {})) | set(cfg.get('retired', []))
    return {
        'case_id': case['case_id'],
        'config_version': case['pinned_config_version'],
        'material': {k: v for k, v in sorted(case['material'].items()) if k in known},
        'permissions': dict(sorted(case['permissions'].items())),
        'deleted_fields': sorted(case.get('deleted_fields', [])),
        'approvals': dict(sorted(case['approvals'].items())),
    }


# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------

def base_config():
    return {
        'config_version': 1,
        'modes': ['exchange', 'paid_service'],
        'fields': {
            'scope': {'label': 'Обсяг робіт', 'required': True, 'agreed_content': True, 'kind': 'text', 'order': 1},
            'compensation': {'label': 'Винагорода', 'required': True, 'agreed_content': True, 'kind': 'money', 'order': 2},
            'deadlines': {'label': 'Строки', 'required': True, 'agreed_content': True, 'kind': 'date', 'order': 3},
            'acceptance': {'label': 'Приймання', 'required': True, 'agreed_content': True, 'kind': 'text', 'order': 4},
            'ip': {'label': 'Права', 'required': True, 'agreed_content': True, 'kind': 'text', 'order': 5},
            'confidentiality': {'label': 'Конфіденційність', 'required': True, 'agreed_content': True, 'kind': 'text', 'order': 6},
            'termination': {'label': 'Припинення', 'required': True, 'agreed_content': True, 'kind': 'text', 'order': 7},
            'out_of_scope': {'label': 'Поза обсягом', 'required': False, 'agreed_content': True, 'kind': 'text', 'order': 8},
            'intro_note': {'label': 'Коротко про себе', 'required': False, 'agreed_content': False, 'kind': 'text', 'order': 9},
        },
        'flow': ['profile', 'match', 'case', 'trial', 'outcome'],
        'copy': {'cta_primary': 'Запропонувати співпрацю'},
        'retired': [],
    }


def base_case(cid='c1', status='in_flight'):
    return {
        'case_id': cid,
        'status': status,
        'pinned_config_version': 1,
        'material': {'scope': 'лендінг', 'compensation': '800 CHF', 'deadlines': '2 тижні',
                     'acceptance': 'демо', 'ip': 'замовнику', 'confidentiality': 'так',
                     'termination': '7 днів', 'out_of_scope': 'копірайтинг', 'intro_note': 'привіт'},
        'permissions': {'a': 'granted', 'b': 'granted'},
        'approvals': {'a': 'v1', 'b': 'v1'},
        'deleted_fields': [],
    }


# --------------------------------------------------------------------------
# Tests
# --------------------------------------------------------------------------

results = []


def check(name, claim, passed, detail):
    results.append((name, passed))
    print(f"[{'PASS' if passed else 'FAIL'}] {name}")
    print(f"       claim : {claim}")
    print(f"       result: {detail}\n")


def t1_schema_allowlist():
    ok = 0
    for bad, why in [
        ({'config_version': 1, 'nonsense': 1}, 'unknown top-level key'),
        ({'config_version': 1, 'store': 'postgres://x'}, 'declares its own store'),
        ({'config_version': 0}, 'non-positive version'),
        ({'config_version': 1, 'modes': ['barter']}, 'unknown mode'),
        ({'config_version': 1, 'fields': {'intro_note': {'agreed_content': True}}}, 'non-P04 field claiming agreed_content'),
        ({'config_version': 1, 'fields': {'scope': {'agreed_content': False}}}, 'P04 field denying agreed_content'),
    ]:
        try:
            validate(bad)
        except ConfigError:
            ok += 1
    check('T1 allowlist and store ban',
          'the validator rejects unknown keys, a self-declared store (P15), unknown modes and mislabelled agreed content',
          ok == 6 and validate(base_config()),
          f'{ok}/6 malformed configurations rejected; the base configuration validates')


def t2_material_change_resets_approvals():
    old = base_config()
    new = copy.deepcopy(old)
    new['config_version'] = 2
    new['fields']['compensation']['label'] = 'Оплата за результат'  # agreed content label
    cases = [base_case('c1'), base_case('c2')]
    _, rep = apply_config(cases, old, new)
    check('T2 material change resets both approvals',
          'renaming a field that is part of agreed content is MATERIAL and resets both acceptances (P04 acceptance, verbatim)',
          rep['class'] == MATERIAL and rep['approvals_reset'] == ['c1', 'c2'],
          f"class={rep['class']}, changes={rep['changes']}, reset={rep['approvals_reset']}")


def t3_presentation_change_does_not_reset():
    old = base_config()
    new = copy.deepcopy(old)
    new['config_version'] = 2
    new['fields']['intro_note']['label'] = 'Пара слів про себе'  # not agreed content
    new['fields']['scope']['order'] = 2
    new['fields']['compensation']['order'] = 1
    new['copy']['cta_primary'] = 'Почати співпрацю'
    cases = [base_case('c1')]
    out, rep = apply_config(cases, old, new)
    check('T3 cosmetic change does not reset',
          'reordering, density and copy outside agreed content is PRESENTATION and resets nothing (P04: cosmetic UI outside agreed content does not)',
          rep['class'] == PRESENTATION and rep['approvals_reset'] == [] and out[0]['approvals'] == {'a': 'v1', 'b': 'v1'},
          f"class={rep['class']}, {len(rep['changes'])} changes, approvals intact: {out[0]['approvals']}")


def t4_removal_requires_retirement():
    old = base_config()
    new = copy.deepcopy(old)
    new['config_version'] = 2
    del new['fields']['intro_note']
    try:
        classify_change(old, new)
        silent = True
    except ConfigError:
        silent = False
    new['retired'] = ['intro_note']
    cls, _ = classify_change(old, new)
    check('T4 removal cannot be silent',
          'a field cannot disappear without being listed as retired; P15 requires old exports to keep round-tripping',
          not silent and cls == REMOVAL,
          'silent removal rejected; declared retirement classified as REMOVAL')


def t5_old_export_round_trips():
    v1 = base_config()
    v2 = copy.deepcopy(v1)
    v2['config_version'] = 2
    del v2['fields']['intro_note']
    v2['retired'] = ['intro_note']
    v2['fields']['referral_terms'] = {'label': 'Умови рекомендації', 'required': False,
                                      'agreed_content': False, 'kind': 'text', 'order': 10}
    by_version = {1: v1, 2: v2}
    case = base_case('c1', status='agreed')
    before = export_case(case, by_version)
    cases, _ = apply_config([case], v1, v2)
    after = export_case(cases[0], by_version)
    identical = json.dumps(before, sort_keys=True, ensure_ascii=False) == json.dumps(after, sort_keys=True, ensure_ascii=False)
    check('T5 agreed case round-trips across a config revision',
          'an agreed case keeps its pinned version, so its export is byte-identical before and after the surface changes (P15)',
          identical and before['config_version'] == 1 and 'intro_note' in before['material'],
          f"pinned v{before['config_version']}; retired field still exported: {'intro_note' in after['material']}; "
          f"export identical: {identical}")


def t6_permissions_and_deletions_survive():
    v1 = base_config()
    v2 = copy.deepcopy(v1)
    v2['config_version'] = 2
    v2['fields']['compensation']['required'] = False  # MATERIAL
    case = base_case('c1')
    case['permissions'] = {'a': 'granted', 'b': 'revoked'}
    case['deleted_fields'] = ['intro_note']
    out, rep = apply_config([case], v1, v2)
    kept = out[0]['permissions'] == {'a': 'granted', 'b': 'revoked'} and out[0]['deleted_fields'] == ['intro_note']
    check('T6 permissions and deletions survive migration',
          'a MATERIAL revision resets approvals but never resurrects a revoked permission or a deleted field (P15)',
          kept and rep['class'] == MATERIAL and out[0]['approvals'] == {},
          f"permissions {out[0]['permissions']}, deleted {out[0]['deleted_fields']}, approvals {out[0]['approvals']}")


def t7_version_must_rise():
    v1 = base_config()
    same = copy.deepcopy(v1)
    try:
        apply_config([base_case()], v1, same)
        rose = False
    except ConfigError:
        rose = True
    check('T7 a revision must raise the version',
          'applying a surface change without raising config_version is refused, so a case pin always resolves to one definite surface',
          rose,
          'unversioned revision rejected')


def t8_adding_agreed_field_is_material():
    v1 = base_config()
    v2 = copy.deepcopy(v1)
    v2['config_version'] = 2
    v2['fields']['out_of_scope']['required'] = True
    cls, changes = classify_change(v1, v2)
    v3 = copy.deepcopy(v1)
    v3['config_version'] = 2
    v3['modes'] = v1['modes'] + ['referral']
    cls2, _ = classify_change(v1, v3)
    check('T8 classification boundaries',
          'making an agreed-content field required is MATERIAL; adding a collaboration mode is only SURFACE_ADDITIVE',
          cls == MATERIAL and cls2 == SURFACE_ADDITIVE,
          f"required-change -> {cls} ({changes}); mode addition -> {cls2}")


def main():
    print('ADP-07 versioned surface configuration: contract checks')
    print('=' * 78)
    t1_schema_allowlist()
    t2_material_change_resets_approvals()
    t3_presentation_change_does_not_reset()
    t4_removal_requires_retirement()
    t5_old_export_round_trips()
    t6_permissions_and_deletions_survive()
    t7_version_must_rise()
    t8_adding_agreed_field_is_material()
    passed = sum(1 for _, p in results if p)
    print('=' * 78)
    print(f'{passed}/{len(results)} checks passed. provider calls: 0. usd: 0.00')
    return 0 if passed == len(results) else 1


if __name__ == '__main__':
    sys.exit(main())

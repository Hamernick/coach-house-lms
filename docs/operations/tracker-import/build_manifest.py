"""Offline, read-only workbook conversion. Writes a private manifest; never calls production."""
import argparse
from collections import Counter
from datetime import datetime, timedelta
import hashlib
import html
import json
from pathlib import Path
import posixpath
import re
import uuid
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NAMESPACE = 'coach-house-tracker-20260928'
SOURCE_HASH = '96b72bf4f3252e8569d06067df5a18cbea58dbb63af85294f07441295982dba1'
ORG = 'c5405481-cea7-418a-b0c3-531ec942c047'
ACTOR = '886455ec-a664-4f13-83f1-471ddd1f5ffd'
PEOPLE = {
    'Joel': '64cf262e-e526-4601-8a2a-f50d1c11c8c2',
    'Paula': ORG,
    'Karissa': '15251245-8bd1-4ea5-ad42-401b9f56f7f8',
    'Caleb': ACTOR,
}
NAMES = {name: name + ' Hamernick' for name in PEOPLE}
NAMES['Karissa'] = 'Karissa'
HELD_PROJECTS = {'P-002', 'PROJ-B425A366'}
HELD_TASKS = {'TASK-004', 'TASK-893141C7', 'TASK-054', 'TASK-055', 'TASK-PERSONAL-BILLS-0924'}
TABLES = {
    'Projects': ('Project ID', 41), 'Tasks': ('Task ID', 264),
    'Project Templates': ('Template ID', 4), 'Template Tasks': ('Template Task ID', 26),
    'Recurring Tasks': ('Recurring Task ID', 4), 'Work Inbox': (None, 9),
}


def stable_id(kind, source_id):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'{NAMESPACE}/{kind}/{source_id}'))


def read_workbook(path):
    if hashlib.sha256(path.read_bytes()).hexdigest() != SOURCE_HASH:
        raise ValueError('Workbook changed; re-audit before generating a manifest')
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rel = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
    with ZipFile(path) as z:
        strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns)]
        rels = {x.attrib['Id']: posixpath.normpath('xl/' + x.attrib['Target']) for x in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        output = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet', ns):
            name = sheet.get('name')
            if name not in TABLES:
                continue
            rows = []
            for row in ET.fromstring(z.read(rels[sheet.attrib[rel]])).findall('m:sheetData/m:row', ns):
                cells = {}
                for cell in row:
                    v = cell.find('m:v', ns)
                    value = v.text if v is not None else None
                    if cell.get('t') == 's' and value is not None:
                        value = strings[int(value)]
                    if cell.get('t') == 'inlineStr':
                        value = ''.join(cell.find('m:is', ns).itertext())
                    if value is not None:
                        cells[re.sub(r'\d', '', cell.get('r'))] = value
                rows.append((int(row.get('r')), cells))
            headers = dict(next(c for row, c in rows if row == 2))
            id_key, expected = TABLES[name]
            values = []
            for row, cells in rows:
                if row <= 2:
                    continue
                record = {headers[k]: v for k, v in cells.items() if k in headers}
                if not record.get(id_key or 'Captured Text'):
                    continue
                values.append({'_row': row, **record})
            if len(values) != expected:
                raise ValueError(f'{name}: expected {expected}, found {len(values)}')
            if id_key and len({v[id_key] for v in values}) != expected:
                raise ValueError(f'Duplicate source IDs in {name}')
            output[name] = values
        return output


def day(value):
    if not value:
        return None
    # Excel serial calendar dates; retain fractional source values separately.
    return (datetime(1899, 12, 30) + timedelta(days=int(float(value)))).date().isoformat()


def display_day(value):
    try:
        return day(value)
    except (ValueError, OverflowError):
        return value  # Preserve malformed source labels verbatim.


def priority(value, *, entity):
    defaults = {'project': 'medium', 'task': 'no-priority'}
    if entity not in defaults:
        raise ValueError(f'Unknown priority entity: {entity}')
    source = (value or defaults[entity]).lower()
    mapped = {'on fire!': 'urgent'}.get(source, source)
    allowed = {'low', 'medium', 'high', 'urgent'}
    if entity == 'task':
        allowed.add('no-priority')
    if mapped not in allowed:
        raise ValueError(f'Invalid {entity} priority: {value}')
    return mapped


def description(record, omitted=()):
    omitted = (*omitted, 'Proposed Owner', 'Proposed By', 'Proposed Date', 'Accepted Date', 'Acceptance Notes', 'Assignment Status')
    record = {k: (display_day(v) if k in {'Planned Week', 'Estimated Start Date', 'Deadline', 'Completed Date', 'Start Date', 'Target Completion Date', 'Source Date', 'Captured Date', 'Next Generation Date'} else (f'{float(v):g} minutes' if k == 'Estimated Minutes' else v)) for k, v in record.items()}
    return ''.join(f'<p><strong>{html.escape(k)}:</strong> {html.escape(str(v)).replace(chr(10), "<br>")}</p>'
                   for k, v in record.items() if k not in ('_row', *omitted) and v)


def metadata(record, project=False):
    owner = record.get('Project Owner' if project else 'Owner')
    collaborators = [record[f'Collaborator {n}'] for n in range(1, 5) if record.get(f'Collaborator {n}')]
    names = [owner, record.get('Proposed Owner'), *collaborators]
    if any(name and name not in {*PEOPLE, 'Franklin'} for name in names):
        raise ValueError('Unknown person mapping')
    data = {'sourceId': record['Project ID' if project else 'Task ID'], 'ownerName': owner,
            'ownerUserId': PEOPLE.get(owner), 'collaboratorNames': collaborators,
            'collaboratorUserIds': [PEOPLE[n] for n in collaborators if n in PEOPLE]}
    for key, column in {'proposedOwnerName': 'Proposed Owner', 'assignmentStatus': 'Assignment Status',
                        'proposedBy': 'Proposed By', 'acceptanceNotes': 'Acceptance Notes',
                        'waitingType': 'Waiting Type', 'waitingFor': 'Waiting For',
                        'sourceType': 'Source Type', 'sourcePerson': 'Source Person',
                        'sourceReference': 'Source Reference', 'recurringTaskId': 'Recurring Task ID'}.items():
        data[key] = record.get(column)
    data['proposedUserId'] = PEOPLE.get(record.get('Proposed Owner'))
    for key, column in {'proposedDate': 'Proposed Date', 'acceptedDate': 'Accepted Date',
                        'plannedWeek': 'Planned Week', 'completedDate': 'Completed Date'}.items():
        data[key] = day(record.get(column))
    data['estimatedMinutes'] = float(record['Estimated Minutes']) if record.get('Estimated Minutes') else None
    return {k: v for k, v in data.items() if v is not None}


def build(book):
    m = {'batchId': stable_id('batch', SOURCE_HASH), 'namespace': NAMESPACE, 'sourceHash': SOURCE_HASH,
         'orgId': ORG, 'actorId': ACTOR, 'links': [], 'projects': [], 'tasks': [], 'notes': [], 'records': [], 'auxiliaryRecords': []}

    def ledger(table, row, disposition, destination=None, native=None, reason=None, auxiliary=False):
        id_key = TABLES.get(table, (None, 0))[0]
        sid = row.get(id_key) if id_key else f'row-{row["_row"]}'
        item = {'entityType': table, 'sourceId': sid, 'sourceRow': row['_row'], 'source': row,
                'disposition': disposition, 'destinationId': destination, 'nativeType': native, 'reason': reason}
        m['auxiliaryRecords' if auxiliary else 'records'].append(item)

    projects = {}
    for row in book['Projects']:
        pid = stable_id('project', row['Project ID'])
        projects[row['Project Name']] = (pid, row['Project ID'] in HELD_PROJECTS)
        if row['Project ID'] in HELD_PROJECTS:
            ledger('Projects', row, 'held', reason='Example/test project; retained privately for review')
            continue
        tracker = metadata(row, True)
        m['projects'].append({'id': pid, 'name': row['Project Name'], 'description': description(row),
            'status': {'Active': 'active', 'On Hold': 'on-hold', 'Complete': 'completed'}[row['Status']],
            'priority': priority(row.get('Priority'), entity='project'), 'startDate': day(row.get('Start Date')),
            'endDate': day(row.get('Target Completion Date')), 'typeLabel': row.get('Project Type'),
            'tags': [v for v in [row.get('Work Area'), 'Tracker import'] if v],
            'members': [NAMES.get(n, n) for n in [tracker.get('ownerName'), *tracker['collaboratorNames']] if n],
            'tracker': tracker})
        ledger('Projects', row, 'created', pid, 'project')
    unsorted = stable_id('project', 'standalone-work')
    references = projects['Project Management Tool'][0]
    m['projects'].append({'id': unsorted, 'name': 'Unsorted work', 'description': '<p>Business tasks without an original project. Original project values remain in task details.</p>',
        'status': 'active', 'priority': 'medium', 'startDate': None, 'endDate': None, 'typeLabel': None,
        'tags': ['Tracker import'], 'members': [], 'tracker': {'sourceId': 'standalone-work'}})
    ledger('Auxiliary projects', {'_row': 1}, 'created', unsorted, 'project', auxiliary=True)
    for row in book['Tasks']:
        parent, parent_held = projects.get(row.get('Project'), (unsorted, False))
        if row['Task ID'] in HELD_TASKS or parent_held:
            ledger('Tasks', row, 'held', reason='Personal/test candidate or held parent; retained privately for review')
            continue
        tid = stable_id('task', row['Task ID'])
        tracker = metadata(row)
        m['tasks'].append({'id': tid, 'projectId': parent, 'title': row['Task Name'],
            'description': description(row, ('Focus Score',)), 'status': {'Not Started': 'todo', 'In Progress': 'in-progress', 'Waiting': 'waiting', 'Complete': 'done'}[row['Status']],
            'startDate': day(row.get('Estimated Start Date')), 'endDate': day(row.get('Deadline')),
            'priority': priority(row.get('Priority'), entity='task'), 'workArea': row.get('Work Area') or 'General',
            'sortOrder': row['_row'], 'assigneeId': PEOPLE.get(row.get('Owner')), 'tracker': tracker})
        ledger('Tasks', row, 'created', tid, 'task')
    # Readable inactive references; no script execution, template automation or duplicate task generation.
    for index, row in enumerate(book['Project Templates']):
        steps = [r for r in book['Template Tasks'] if r.get('Project Template ID') == row['Template ID']]
        nid = stable_id('note', row['Template ID'])
        m['notes'].append({'id': nid, 'projectId': references, 'title': 'Template reference: ' + row['Template Name'],
            'content': '<p>Imported reference. Automatic template creation is not enabled.</p>' + description(row) + ''.join('<hr>' + description(r) for r in steps)})
        ledger('Project Templates', row, 'reference', nid, 'note')
        for step in steps:
            ledger('Template Tasks', step, 'reference', nid, 'note')
    for row in book['Recurring Tasks']:
        nid = stable_id('note', row['Recurring Task ID'])
        m['notes'].append({'id': nid, 'projectId': references, 'title': 'Inactive recurrence: ' + row['Task Template Name'],
            'content': '<p>Imported reference. This schedule is inactive and generates no tasks.</p>' + description(row)})
        ledger('Recurring Tasks', row, 'reference', nid, 'note')
    nid = stable_id('note', 'work-inbox')
    m['notes'].append({'id': nid, 'projectId': references, 'title': 'Original work inbox: 9 captures',
        'content': '<p>Original captures preserved for team triage. These have not been accepted as tasks.</p>' + ''.join('<hr>' + description(r) for r in book['Work Inbox'])})
    for row in book['Work Inbox']:
        ledger('Work Inbox', row, 'reference', nid, 'note')
    assert len(m['records']) == 348
    for item in [*m['projects'], *m['tasks']]:
        if item['startDate'] and item['endDate'] and item['endDate'] < item['startDate']:
            raise ValueError(f'Inverted source dates: {item["id"]}')
    return m


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    manifest = build(read_workbook(args.workbook))
    args.output.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as file:
        args.output.chmod(0o600)
        json.dump(manifest, file, ensure_ascii=False, separators=(',', ':'))
    print(json.dumps({'manifestHash': hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'sourceRecords': len(manifest['records']), 'dispositions': dict(Counter(r['disposition'] for r in manifest['records'])),
        'projectsCreated': len(manifest['projects']), 'tasksCreated': len(manifest['tasks']), 'referenceNotes': len(manifest['notes'])}))

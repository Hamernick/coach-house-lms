"""Offline national-size serving test. Never connects to production or publishes."""
import argparse
import concurrent.futures
import csv
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import time
from datetime import datetime, timezone


def measure(sql):
    report = {}
    def query(args):
        began = time.monotonic()
        response = json.loads(sql("set role anon; set statement_timeout='3s'; select public.search_nonprofit_directory(" + args + ");"))
        assert len(response) <= 20
        assert all(set(r) <= {'ein', 'name', 'city', 'state', 'postalCode', 'website', 'phone', 'description',
                             'websiteBasis', 'websiteSourcePeriod', 'phoneBasis', 'phoneSourcePeriod',
                             'descriptionSourcePeriod', 'operatingStatus', 'listingType'} for r in response)
        return {'ms': (time.monotonic() - began) * 1000, 'rows': len(response), 'bytes': len(json.dumps(response).encode())}

    cases = {q: "'" + q + "',null,null,20" for q in ['food', 'community', 'church', 'health', 'education', 'foundation', 'zzzzunmatchedterm']}
    cases.update({'food_IL': "'food','IL',null,20", 'late_cursor': "'community',null,'800000000',20", 'browse': "'',null,null,20"})
    # A restarted PostgreSQL cache is useful but is not an OS-cold disk test.
    report['firstReadAfterRestart'] = query(cases['food'])
    measurements = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        for name, args in cases.items():
            samples = list(pool.map(query, [args] * 30))
            timings = sorted(s['ms'] for s in samples)
            measurements[name] = {'p95Ms': timings[28], 'maxMs': max(timings), 'maxResponseBytes': max(s['bytes'] for s in samples)}
            print(json.dumps({'phase': 'queried', 'query': name, **measurements[name]}), flush=True)
    report['queries'] = measurements
    report['meetsLocalP95Target'] = all(s['p95Ms'] < 500 for s in measurements.values())
    report['queryPlan'] = sql("explain (analyze,buffers,format json) select ein,item from public.nonprofit_directory_public where search_document @@ websearch_to_tsquery('english','food') order by ein limit 20;")
    return report


def benchmark(state, output, limit):
    if output.exists():
        raise ValueError('Output must be new')
    os.umask(0o077)
    report = {'environment': 'disposable local PostgreSQL; real identity-shaped data, not a publication artifact; fsync disabled; OS cache not cleared',
              'publicWrites': 0, 'concurrency': 10, 'limit': limit}
    root = Path(__file__).resolve().parents[4]
    bindir = Path(subprocess.check_output(['pg_config', '--bindir'], text=True).strip())
    temp = Path(tempfile.mkdtemp(prefix='nonprofit-national-pg-'))
    port = str(61000 + os.getpid() % 3000)
    started = False

    def run(name, args, text=None, timeout=600):
        return subprocess.run([str(bindir / name), *args], input=text, text=True,
                              capture_output=True, check=True, timeout=timeout,
                              env={**os.environ, 'LC_ALL': 'C'}).stdout

    def sql(text):
        return run('psql', ['-X', '-h', str(temp), '-p', port, '-U', 'postgres', '-d', 'postgres',
                            '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A'], text)


    try:
        run('initdb', ['-D', str(temp / 'db'), '-A', 'trust', '-U', 'postgres'])
        run('pg_ctl', ['-D', str(temp / 'db'), '-o', f"-F -k {temp} -p {port} -h '' -c shared_buffers=128MB",
                       '-l', str(temp / 'postgres.log'), '-w', 'start'])
        started = True
        sql('create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; '
            'create table public.organizations(user_id uuid primary key,ein text); '
            'create table public.resource_map_organizations(id uuid primary key,ein text); '
            'grant usage on schema public to anon,authenticated,service_role;')
        for name in ['20261006193000_nonprofit_directory.sql', '20261006193100_nonprofit_directory_publication.sql']:
            sql((root / 'supabase/migrations' / name).read_text())
        began = time.monotonic()
        ledger = sqlite3.connect('file:' + str(state / 'research.sqlite') + '?mode=ro', uri=True)
        ledger.execute('begin')
        expected = ledger.execute('select count(*) from organizations').fetchone()[0]
        expected = min(expected, limit) if limit else expected
        path = temp / 'records.csv'
        digest = hashlib.sha256()
        count = 0
        with path.open('x', newline='') as f:
            writer = csv.writer(f)
            rows = ledger.execute('select ein,identity from organizations order by ein limit ?', (expected,))
            for ein, raw in rows:
                identity = json.loads(raw)
                address = identity.get('filingAddress') or {}
                content = {'ein': ein, 'name': identity['organizationName'],
                           'city': address.get('city'), 'state': address.get('state'), 'postalCode': address.get('postalCode')}
                body = json.dumps(content, separators=(',', ':'), sort_keys=True)
                digest.update((ein + '\n').encode())
                writer.writerow([ein, body, hashlib.sha256(body.encode()).hexdigest(), 'nonprofit-directory-retained-audit-v1'])
                count += 1
        ledger.close()
        assert count == expected and count > 0
        report.update(records=count, einDigest=digest.hexdigest(), exportSeconds=time.monotonic() - began)
        print(json.dumps({'phase': 'exported', 'records': count}), flush=True)
        began = time.monotonic()
        sql("\\copy public.nonprofit_directory(ein,content,record_digest,policy_version) from '" + str(path) + "' with (format csv);\nanalyze public.nonprofit_directory;")
        report['loadSeconds'] = time.monotonic() - began
        assert int(sql('select count(*) from public.nonprofit_directory;')) == expected
        # Real app/curated exclusion cardinalities; separate fixture entities cannot
        # create a published claim and are confined to this disposable database.
        sql("insert into public.organizations select gen_random_uuid(),ein from public.nonprofit_directory order by ein desc limit 63; "
            "insert into public.resource_map_organizations select gen_random_uuid(),ein from public.nonprofit_directory order by ein desc offset 63 limit 877; "
            "analyze public.organizations; analyze public.resource_map_organizations;")
        report['tableAndIndexBytes'] = int(sql("select pg_total_relation_size('public.nonprofit_directory');"))
        print(json.dumps({'phase': 'loaded', 'records': count, 'bytes': report['tableAndIndexBytes']}), flush=True)
        run('pg_ctl', ['-D', str(temp / 'db'), '-m', 'fast', '-l', str(temp / 'postgres.log'), '-w', 'restart'])
        report.update(measure(sql))
        report['completedAt'] = datetime.now(timezone.utc).isoformat()
    except Exception as error:
        report['error'] = str(error)
        if isinstance(error, subprocess.CalledProcessError):
            report['stderr'] = error.stderr
        raise
    finally:
        if started:
            run('pg_ctl', ['-D', str(temp / 'db'), '-m', 'fast', '-w', 'stop'])
        shutil.rmtree(temp)
        with output.open('x') as f:
            json.dump(report, f, indent=2)
            f.write('\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument('--all', action='store_true')
    selection.add_argument('--limit', type=int)
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1000:
        parser.error('--limit must be at least 1000')
    benchmark(args.state.resolve(), args.output.resolve(), args.limit)

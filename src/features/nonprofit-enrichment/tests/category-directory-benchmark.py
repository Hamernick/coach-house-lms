"""Measure real national category data in disposable PostgreSQL. No public writes."""
import argparse
import concurrent.futures
import csv
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import time

spec = importlib.util.spec_from_file_location('national', Path(__file__).with_name('national-directory-benchmark.py'))
national = importlib.util.module_from_spec(spec)
spec.loader.exec_module(national)


def measure_categories(sql, release, mapping):
    for name in ['20261007070000_nonprofit_categories.sql', '20261007070100_nonprofit_category_publication.sql']:
        sql((release / 'supabase/migrations' / name).read_text())
    with tempfile.TemporaryDirectory(prefix='nonprofit-category-export-') as scratch:
        path = Path(scratch) / 'categories.csv'
        source = sqlite3.connect('file:' + str(mapping / 'classifications.sqlite') + '?mode=ro', uri=True)
        with path.open('x', newline='') as output:
            writer = csv.writer(output)
            for ein, categories in source.execute("select ein,categories from classifications where state='mapped' order by ein"):
                writer.writerow([ein, json.dumps({'ein': ein, 'categories': json.loads(categories)})])
        source.close()
        sql("create temporary table category_import(ein text,content jsonb);\n\\copy category_import from '" + str(path) + "' with (format csv);\n"
            "insert into public.nonprofit_category_sets(ein,content,record_digest) select c.ein,c.content,repeat('a',64) from category_import c join public.nonprofit_directory d using(ein);"
            "insert into public.nonprofit_directory_categories select ein,jsonb_array_elements_text(content->'categories') from public.nonprofit_category_sets;"
            "analyze public.nonprofit_category_sets; analyze public.nonprofit_directory_categories;")
    cases = {
        'food_browse': "'',null,'food',null,20", 'faith_browse': "'',null,'faith',null,20",
        'food_text': "'food',null,'food',null,20", 'faith_text': "'church',null,'faith',null,20",
        'food_state': "'food','IL','food',null,20", 'late_cursor': "'',null,'community','800000000',20",
        'unmatched': "'zzzzunmatchedterm',null,'health',null,20",
        'service_leaf': "'',null,'food_food_pantries',null,20", 'arts_state': "'museum','NY','arts',null,20",
    }
    def query(args):
        began = time.monotonic()
        rows = json.loads(sql("set role anon; set statement_timeout='3s'; select public.search_nonprofit_directory_v2(" + args + ");"))
        assert len(rows) <= 20
        assert len(set(r['ein'] for r in rows)) == len(rows)
        return (time.monotonic() - began) * 1000
    measurements = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        for name, args in cases.items():
            samples = sorted(pool.map(query, [args] * 30))
            measurements[name] = {'p95Ms': samples[28], 'maxMs': samples[-1]}
            print(json.dumps({'phase': 'category-query', 'query': name, **measurements[name]}), flush=True)
    return {'categoryQueries': measurements, 'categoryP95Under500ms': all(r['p95Ms'] < 500 for r in measurements.values()),
            'mappedOrganizations': int(sql('select count(*) from public.nonprofit_category_sets;')),
            'categoryAssignments': int(sql('select count(*) from public.nonprofit_directory_categories;')),
            'categoryTableAndIndexBytes': int(sql("select pg_total_relation_size('public.nonprofit_category_sets')+pg_total_relation_size('public.nonprofit_directory_categories');")),
            'categoryPlan': json.loads(sql("explain (analyze,buffers,format json) select d.ein from public.nonprofit_directory_categories c join public.nonprofit_directory_public d on d.ein=c.ein where c.category='faith' order by c.ein limit 20;")),
            'note': 'Ten concurrent local readers; identity-shaped records and real classifications. No concurrent writer or hosted-network SLA claim.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path, required=True)
    parser.add_argument('--mapping', type=Path, required=True)
    parser.add_argument('--release', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--limit', type=int)
    args = parser.parse_args()
    national.measure = lambda sql: measure_categories(sql, args.release.resolve(), args.mapping.resolve())
    national.benchmark(args.state.resolve(), args.output.resolve(), args.limit)

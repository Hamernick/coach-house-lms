import { test } from "node:test"
import { execFileSync, spawnSync, spawn } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import assert from "node:assert/strict"

test(
  "directory SQL enforces access, atomic replay, owner precedence and revision-safe rollback",
  { timeout: 60000 },
  async () => {
    const bin =
      process.env.POSTGRES_BINDIR ||
      execFileSync("pg_config", ["--bindir"], { encoding: "utf8" }).trim()
    const directory = mkdtempSync(join(tmpdir(), "nonprofit-directory-pg-")),
      port = String(61000 + (process.pid % 3000))
    let started = false
    const run = (name, args, input) =>
      execFileSync(join(bin, name), args, {
        encoding: "utf8",
        input,
        env: { ...process.env, LC_ALL: "C" },
        stdio: ["pipe", "pipe", "pipe"],
      })
    const sql = (input) =>
      run(
        "psql",
        [
          "-h",
          "/tmp",
          "-p",
          port,
          "-U",
          "postgres",
          "-d",
          "postgres",
          "-v",
          "ON_ERROR_STOP=1",
          "-q",
          "-t",
          "-A",
        ],
        input
      )
    try {
      run("initdb", ["-D", directory, "-A", "trust", "-U", "postgres"])
      run("pg_ctl", [
        "-D",
        directory,
        "-o",
        `-F -k /tmp -p ${port} -h ''`,
        "-l",
        join(directory, "postgres.log"),
        "-w",
        "start",
      ])
      started = true
      sql(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      grant usage on schema public to anon,authenticated,service_role;
      create table public.organizations(user_id uuid primary key default gen_random_uuid(),ein text);
      create table public.resource_map_organizations(id uuid primary key default gen_random_uuid(),ein text);
      create table public.resource_map_categories(key text primary key,label text,parent_key text references public.resource_map_categories(key),sort_order integer,marker_color text,icon_name text,aliases text[],description text,updated_at timestamptz default now());
      create function public.test_assert(ok boolean,message text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception '%',message; end if; end$$;`)
      for (const file of [
        "20261006193000_nonprofit_directory.sql",
        "20261006193100_nonprofit_directory_publication.sql",
        "20261007070000_nonprofit_categories.sql",
        "20261007070100_nonprofit_category_publication.sql",
        "20260628150000_resource_map_taxonomy_categories.sql",
        "20261007070200_resource_category_topics.sql",
        "20261007190000_nonprofit_search_custom_plans.sql",
      ])
        sql(
          readFileSync(join(process.cwd(), "supabase/migrations", file), "utf8")
        )
      sql(`
      insert into public.nonprofit_directory_settings(singleton,target_ref,publication_enabled) values(true,'abcdefghijklmnopqrst',true);
      create function public.test_chunk(batch uuid,n integer,ein text,label text,expected text default null) returns jsonb language sql as $$
        select public.publish_nonprofit_directory_chunk(batch,repeat('a',64),n,
          jsonb_build_array(jsonb_build_object('ein',ein,'recordText',r::text,'recordDigest',encode(sha256(convert_to(r::text,'UTF8')),'hex'),'expectedDigest',expected))::text,
          'abcdefghijklmnopqrst','nonprofit-directory-retained-audit-v1','explicit test authorization')
        from (select jsonb_build_object('ein',ein,'name',label,'city','Chicago','state','IL') r) x;
      $$;
      set role service_role;
      select public.test_assert(public.nonprofit_directory_preflight(array['012345678'])->'rows'->0->>'ein'='012345678','preflight failed');
      select public.test_assert((public.test_chunk('00000000-0000-4000-8000-000000000001',0,'012345678','Community Food Center')->'outcomes'->0->>'status')='inserted','insert failed');
      select public.test_assert((public.test_chunk('00000000-0000-4000-8000-000000000001',0,'012345678','Community Food Center')->>'replayed')::boolean,'replay failed');
      select public.test_assert((select count(*)=1 from public.nonprofit_directory),'replay duplicated rows');
      do $$begin
        begin perform public.test_chunk('00000000-0000-4000-8000-000000000001',0,'012345678','Different content'); raise exception 'changed chunk accepted';
        exception when invalid_parameter_value then null; end;
      end$$;
      select public.test_assert((public.test_chunk('00000000-0000-4000-8000-000000000002',0,'012345678','New name')->'outcomes'->0->>'reason')='previous_digest_changed','missing expected digest overwritten');
      reset role;
      set role anon;
      select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food',null,null,50))=1,'anonymous search failed');
      select public.test_assert(public.get_nonprofit_directory('012345678')->>'name'='Community Food Center','anonymous detail failed');
      select public.test_assert(not (public.get_nonprofit_directory('012345678') ? 'record_digest'),'private digest exposed');
      select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('01-2345678',null,null,50))=1,'EIN search failed');
      select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('',null,'012345678',50))=0,'cursor repeated item');
      do $$begin
        begin perform * from public.nonprofit_directory; raise exception 'raw table readable'; exception when insufficient_privilege then null; end;
        begin perform * from public.nonprofit_publication_chunks; raise exception 'private receipts readable'; exception when insufficient_privilege then null; end;
        begin perform public.test_chunk('00000000-0000-4000-8000-000000000004',0,'012345679','Anonymous injection'); raise exception 'anonymous publish allowed'; exception when insufficient_privilege then null; end;
        begin insert into public.nonprofit_directory(ein,content,record_digest,policy_version) values('012345679','{}',repeat('a',64),'bad'); raise exception 'anonymous insert allowed'; exception when insufficient_privilege then null; end;
      end$$;
      reset role;
      set role authenticated;
      select public.test_assert(public.get_nonprofit_directory('012345678')->>'ein'='012345678','authenticated read failed');
      do $$begin
        begin perform * from public.nonprofit_publication_chunks; raise exception 'authenticated receipts readable'; exception when insufficient_privilege then null; end;
      end$$;
      reset role;
      do $$declare a jsonb:=jsonb_build_object('ein','012345681','name','First atomic row'); b jsonb:=jsonb_build_object('ein','012345682','name','Second atomic row'); begin
        begin
          perform public.publish_nonprofit_directory_chunk('00000000-0000-4000-8000-000000000006',repeat('a',64),0,
            jsonb_build_array(jsonb_build_object('ein','012345681','recordText',a::text,'recordDigest',encode(sha256(convert_to(a::text,'UTF8')),'hex')),
              jsonb_build_object('ein','012345682','recordText',b::text,'recordDigest',repeat('0',64)))::text,
            'abcdefghijklmnopqrst','nonprofit-directory-retained-audit-v1','explicit test authorization');
          raise exception 'bad digest committed';
        exception when invalid_parameter_value then null; end;
        perform public.test_assert(not exists(select 1 from public.nonprofit_directory where ein='012345681'),'partial failed chunk committed');
        perform public.test_assert(not exists(select 1 from public.nonprofit_publication_runs where id='00000000-0000-4000-8000-000000000006'),'failed chunk left batch receipt');
      end$$;
      insert into public.organizations(ein) values('01-2345679');
      set role service_role;
      select public.test_assert((public.test_chunk('00000000-0000-4000-8000-000000000003',0,'012345679','Claimed nonprofit')->'outcomes'->0->>'reason')='existing_platform_organization','owner hold failed');
      select public.test_assert((public.rollback_nonprofit_directory_chunk('00000000-0000-4000-8000-000000000001',0,'abcdefghijklmnopqrst')->>'restoredOrSuppressed')::int=1,'rollback failed');
      reset role;
      set role anon;
      select public.test_assert(public.get_nonprofit_directory('012345678') is null,'rollback remained public');
      reset role;
      set role service_role;
      select public.test_chunk('00000000-0000-4000-8000-000000000005',0,'012345680','Later edited nonprofit');
      update public.nonprofit_directory set content=jsonb_set(content,'{name}','"Owner correction"'),revision=gen_random_uuid(),managed_by='owner' where ein='012345680';
      select public.test_assert((public.rollback_nonprofit_directory_chunk('00000000-0000-4000-8000-000000000005',0,'abcdefghijklmnopqrst')->>'preservedLaterChanges')::int=1,'rollback overwrote later correction');
      reset role;
      insert into public.resource_map_organizations(ein) values('012345680');
      set role anon;
      select public.test_assert(public.get_nonprofit_directory('012345680') is null,'later curated record did not hide registry duplicate');
      reset role;
    `)
      assert.equal(
        sql("select count(*) from public.nonprofit_publication_chunks;").trim(),
        "4"
      )
      sql(readFileSync(join(process.cwd(), "supabase/tests/nonprofit-categories.assertions.sql"), "utf8"))
      sql(readFileSync(join(process.cwd(), "supabase/tests/nonprofit-search-plans.assertions.sql"), "utf8"))
      sql([
        "begin;",
        readFileSync("supabase/migrations/20261008030000_nonprofit_state_search.sql", "utf8"),
        readFileSync("supabase/migrations/20261008220000_nonprofit_category_search_probe.sql", "utf8"),
        "select public.test_chunk('40000000-0000-4000-8000-000000000001',0,'800000001','Zephyr foundation'); select public.test_categories('40000000-0000-4000-8000-000000000002',0,'800000001','[\"food\"]'); select public.test_categories('40000000-0000-4000-8000-000000000003',0,'800000001','[\"housing\"]',(select record_digest from public.nonprofit_category_sets where ein='800000001'));",
        readFileSync("supabase/tests/nonprofit-category-probe.fixtures.sql", "utf8"),
        readFileSync("supabase/migrations/20261008230000_nonprofit_category_search_index.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-category-probe.assertions.sql", "utf8"),
        "select public.backfill_nonprofit_category_search(array(select ein from public.nonprofit_directory where ein between '900000001' and '900000100'),'abcdefghijklmnopqrst');",
        readFileSync("supabase/tests/nonprofit-category-probe.assertions.sql", "utf8"),
        "do $$declare n integer; begin for n in 0..5 loop perform public.backfill_nonprofit_category_search(array(select ein from public.nonprofit_directory where ein between (900000001+n*100)::text and (900000100+n*100)::text),'abcdefghijklmnopqrst'); end loop; end$$;",
        readFileSync("supabase/tests/nonprofit-category-probe.assertions.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-category-index.assertions.sql", "utf8"),
        "rollback;",
      ].join("\n"))
      const stateSearchProof = sql([
        readFileSync("supabase/tests/nonprofit-state-search.fixtures.sql", "utf8"),
        readFileSync("supabase/migrations/20261008030000_nonprofit_state_search.sql", "utf8"),
        readFileSync("supabase/migrations/20261008210000_nonprofit_stopword_state_search.sql", "utf8"),
        readFileSync("supabase/migrations/20261008220000_nonprofit_category_search_probe.sql", "utf8"),
        readFileSync("supabase/migrations/20261008230000_nonprofit_category_search_index.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-state-search.assertions.sql", "utf8"),
      ].join("\n"))
      assert.match(stateSearchProof, /7830/, "state/query/category/cursor matrix completed")
      sql([
        "begin;",
        readFileSync("supabase/migrations/20261008030000_nonprofit_state_search.sql", "utf8"),
        readFileSync("supabase/migrations/20261008210000_nonprofit_stopword_state_search.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-stopword-index.assertions.sql", "utf8"),
        "rollback;",
      ].join("\n"))
      sql([
        "begin;",
        readFileSync("supabase/migrations/20261008030000_nonprofit_state_search.sql", "utf8"),
        readFileSync("supabase/migrations/20261008210000_nonprofit_stopword_state_search.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-category-probe.fixtures.sql", "utf8"),
        readFileSync("supabase/migrations/20261008220000_nonprofit_category_search_probe.sql", "utf8"),
        readFileSync("supabase/tests/nonprofit-category-probe.assertions.sql", "utf8"),
        "rollback;",
      ].join("\n"))
      // Real concurrent sessions: category insertion must wait for a directory
      // edit and copy its committed generated text, never the prior snapshot.
      sql(readFileSync("supabase/migrations/20261008230000_nonprofit_category_search_index.sql", "utf8"))
      sql("select public.test_chunk('50000000-0000-4000-8000-000000000001',0,'800000002','Original text'); insert into public.nonprofit_category_sets(ein,content,record_digest) values('800000002','{\"ein\":\"800000002\"}',repeat('a',64));")
      const editor = spawn(join(bin, "psql"), ["-h", "/tmp", "-p", port, "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"], { stdio: ["pipe", "pipe", "pipe"] })
      let editorError = ""
      editor.stderr.on("data", (chunk) => { editorError += chunk })
      const edited = new Promise((resolve, reject) => {
        editor.on("error", reject)
        editor.on("exit", (code) => code === 0 ? resolve() : reject(new Error(editorError)))
      })
      const locked = new Promise((resolve, reject) => {
        let output = ""
        editor.stdout.on("data", (chunk) => { output += chunk; if (output.includes("LOCKED")) resolve() })
        editor.on("error", reject)
        editor.on("exit", () => { if (!output.includes("LOCKED")) reject(new Error(editorError || "Editor exited before lock")) })
      })
      editor.stdin.end("begin; update public.nonprofit_directory set content=jsonb_set(content,'{name}','\"Concurrent zephyr\"') where ein='800000002'; select 'LOCKED'; select pg_sleep(0.5); commit;")
      await locked
      sql("insert into public.nonprofit_directory_categories(ein,category) values('800000002','food');")
      await edited
      sql("select public.test_assert((select c.search_document=d.search_document from public.nonprofit_directory_categories c join public.nonprofit_directory d using(ein) where c.ein='800000002'),'concurrent category insert copied stale text');")
      sql(readFileSync("docs/plans/2026-10-08-nonprofit-category-search-index-rollback.sql", "utf8"))
      sql("select public.test_assert(not exists(select 1 from information_schema.columns where table_schema='public' and table_name='nonprofit_directory_categories' and column_name='search_document'),'rollback left projection column'); select public.test_assert(public.search_nonprofit_directory_v2('zephyr',null,'food','800000001',21)->0->>'ein'='800000002','rollback lost canonical search result');")
      if (process.env.NONPROFIT_DIRECTORY_BENCHMARK) {
        const records = readFileSync(process.env.NONPROFIT_DIRECTORY_BENCHMARK, "utf8").trim().split("\n").map(JSON.parse)
        if (records.length > 10001 || records.some((r) => !/^\d{9}$/.test(r.ein))) throw new Error("Benchmark must be the bounded audited cohort")
        const began = performance.now()
        const outcomes = {}
        for (let offset=0;offset<records.length;offset+=1000) {
          const payload = JSON.stringify(records.slice(offset,offset+1000).map((r)=>({...r,expectedDigest:null}))).replace(/'/g,"''")
          const result = JSON.parse(sql(`select public.publish_nonprofit_directory_chunk('00000000-0000-4000-8000-000000000007',repeat('b',64),${offset/1000},'${payload}','abcdefghijklmnopqrst','nonprofit-directory-retained-audit-v1','bounded local audited-cohort test');`))
          for (const r of result.outcomes) outcomes[r.status]=(outcomes[r.status]??0)+1
        }
        const insertSeconds=(performance.now()-began)/1000
        assert.equal(outcomes.inserted,records.length)
        const timings=[]
        for(let i=0;i<20;i++) {
          const start=performance.now()
          const result=JSON.parse(sql("set role anon; select public.search_nonprofit_directory('food',null,null,20); reset role;"))
          assert.ok(result.length<=20)
          timings.push(performance.now()-start)
        }
        timings.sort((a,b)=>a-b)
        const report={environment:"isolated local PostgreSQL; psql timings include process startup; warm sequential reads, not production/API load",records:records.length,outcomes,insertSeconds,
          tableAndIndexBytes:Number(sql("select pg_total_relation_size('public.nonprofit_directory');")),searchP95Ms:timings[18]}
        if(process.env.NONPROFIT_DIRECTORY_BENCHMARK_REPORT) writeFileSync(process.env.NONPROFIT_DIRECTORY_BENCHMARK_REPORT,JSON.stringify(report,null,2)+"\n",{flag:"wx",mode:0o600})
        console.log(JSON.stringify(report))
      }
    } catch (error) {
      throw new Error(`${error.message}\n${error.stderr ?? ""}`)
    } finally {
      if (started)
        spawnSync(
          join(bin, "pg_ctl"),
          ["-D", directory, "-m", "fast", "-w", "stop"],
          { stdio: "ignore" }
        )
      rmSync(directory, { recursive: true, force: true })
    }
  }
)

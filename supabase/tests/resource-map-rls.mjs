#!/usr/bin/env node
import { randomUUID } from "node:crypto"

export async function runResourceMapRlsTests({
  admin,
  adminClient,
  adminSessionClient,
  anonClient,
  member,
  memberClient,
  results,
  suffix,
  tableExists,
}) {
  // Resource map raw tables stay private; public reads use the sanitized view/RPC.
  if (await tableExists("resource_map_organizations")) {
    const sourceId = randomUUID()
    const orgId = randomUUID()
    const serviceId = randomUUID()
    const hiddenServiceId = randomUUID()
    const suppressedServiceId = randomUUID()
    const deletedServiceId = randomUUID()
    const importRecordId = randomUUID()
    const publicContactId = randomUUID()
    const privateContactId = randomUUID()
    const publicLinkId = randomUUID()
    const privateLinkId = randomUUID()
    const now = new Date().toISOString()

    const { error: sourceInsertError } = await adminClient
      .from("resource_map_sources")
      .insert({
        id: sourceId,
        name: "RLS Resource Source",
        slug: `rls-resource-source-${suffix}`,
        homepage_url: "https://example.org/source",
        source_type: "manual",
        trust_level: "partner",
      })
    if (sourceInsertError) throw sourceInsertError

    const { error: importInsertError } = await adminClient
      .from("resource_map_import_records")
      .insert({
        id: importRecordId,
        source_id: sourceId,
        source_record_id: `record-${suffix}`,
        raw_snapshot: { private: "raw source payload" },
        extracted_fields: { title: "RLS Resource Service" },
        field_confidence: { title: 95 },
        confidence_score: 95,
        normalized_name: "rls resource service",
        review_status: "needs_review",
        duplicate_match_status: "unique",
      })
    results.push({
      name: "service role can insert resource map import record",
      passed: !importInsertError,
    })
    if (importInsertError) throw importInsertError

    const { error: orgInsertError } = await adminClient
      .from("resource_map_organizations")
      .insert({
        id: orgId,
        source_id: sourceId,
        name: "RLS Resource Org",
        visibility: "published",
        review_status: "approved",
        approved_by: admin.id,
        approved_at: now,
        source_url: "https://example.org/org",
      })
    if (orgInsertError) throw orgInsertError

    const { error: serviceInsertError } = await adminClient
      .from("resource_map_services")
      .insert({
        id: serviceId,
        organization_id: orgId,
        source_id: sourceId,
        title: "RLS Resource Service",
        description: "Public approved test service.",
        service_kind: "service",
        delivery_modes: ["online"],
        visibility: "published",
        review_status: "approved",
        approved_by: admin.id,
        approved_at: now,
        source_url: "https://example.org/service",
      })
    if (serviceInsertError) throw serviceInsertError

    const { error: excludedServicesInsertError } = await adminClient
      .from("resource_map_services")
      .insert([
        {
          id: hiddenServiceId,
          organization_id: orgId,
          source_id: sourceId,
          title: "Hidden RLS Resource Service",
          description: "Should never appear in sanitized public reads.",
          service_kind: "service",
          delivery_modes: ["online"],
          visibility: "published",
          review_status: "approved",
          approved_by: admin.id,
          approved_at: now,
          hidden_by: admin.id,
          hidden_at: now,
          hidden_reason: "RLS hidden fixture",
        },
        {
          id: suppressedServiceId,
          organization_id: orgId,
          source_id: sourceId,
          title: "Suppressed RLS Resource Service",
          description: "Should never appear in sanitized public reads.",
          service_kind: "service",
          delivery_modes: ["online"],
          visibility: "published",
          review_status: "approved",
          approved_by: admin.id,
          approved_at: now,
          suppressed_by: admin.id,
          suppressed_at: now,
          suppression_reason: "RLS suppressed fixture",
        },
        {
          id: deletedServiceId,
          organization_id: orgId,
          source_id: sourceId,
          title: "Deleted RLS Resource Service",
          description: "Should never appear in sanitized public reads.",
          service_kind: "service",
          delivery_modes: ["online"],
          visibility: "published",
          review_status: "approved",
          approved_by: admin.id,
          approved_at: now,
          deleted_by: admin.id,
          deleted_at: now,
          delete_reason: "RLS deleted fixture",
        },
      ])
    if (excludedServicesInsertError) throw excludedServicesInsertError

    const { error: categoryInsertError } = await adminClient
      .from("resource_map_service_categories")
      .insert({
        service_id: serviceId,
        category_key: "food",
        is_primary: true,
        confidence: 100,
        source_id: sourceId,
      })
    if (categoryInsertError) throw categoryInsertError

    const { error: locationInsertError } = await adminClient
      .from("resource_map_locations")
      .insert({
        organization_id: orgId,
        service_id: serviceId,
        label: "RLS test location",
        location_type: "physical",
        city: "New York",
        state: "NY",
        latitude: 40.7128,
        longitude: -74.006,
        geocoding_accuracy: "manual",
        is_primary: true,
      })
    if (locationInsertError) throw locationInsertError

    const { error: contactInsertError } = await adminClient
      .from("resource_map_contacts")
      .insert([
        {
          id: publicContactId,
          organization_id: orgId,
          service_id: serviceId,
          contact_type: "phone",
          label: "Public phone",
          value: "555-0100",
          is_public: true,
        },
        {
          id: privateContactId,
          organization_id: orgId,
          service_id: serviceId,
          contact_type: "email",
          label: "Private email",
          value: "private@example.org",
          is_public: false,
        },
      ])
    if (contactInsertError) throw contactInsertError

    const { error: linkInsertError } = await adminClient
      .from("resource_map_links")
      .insert([
        {
          id: publicLinkId,
          organization_id: orgId,
          service_id: serviceId,
          link_type: "website",
          label: "Public website",
          url: "https://example.org/public",
          domain: "example.org",
          is_public: true,
        },
        {
          id: privateLinkId,
          organization_id: orgId,
          service_id: serviceId,
          link_type: "source",
          label: "Private source",
          url: "https://example.org/private",
          domain: "example.org",
          is_public: false,
        },
      ])
    if (linkInsertError) throw linkInsertError

    const { error: eventInsertError } = await adminSessionClient
      .from("resource_map_curation_events")
      .insert({
        action: "approve",
        organization_id: orgId,
        service_id: serviceId,
        import_record_id: importRecordId,
        actor_id: admin.id,
        reason: "RLS test approval",
        after_state: { visibility: "published", review_status: "approved" },
      })
    results.push({
      name: "admin can write resource map curation event",
      passed: !eventInsertError,
    })

    const { data: anonRawOrgs, error: anonRawOrgError } = await anonClient
      .from("resource_map_organizations")
      .select("id")
      .eq("id", orgId)
    results.push({
      name: "anon cannot read raw resource map organizations",
      passed:
        !anonRawOrgError &&
        Array.isArray(anonRawOrgs) &&
        anonRawOrgs.length === 0,
    })

    const { data: memberImports, error: memberImportError } = await memberClient
      .from("resource_map_import_records")
      .select("id")
      .eq("id", importRecordId)
    results.push({
      name: "authenticated non-admin cannot read resource map import records",
      passed:
        !memberImportError &&
        Array.isArray(memberImports) &&
        memberImports.length === 0,
    })

    const { data: memberEvents, error: memberEventError } = await memberClient
      .from("resource_map_curation_events")
      .select("id")
      .eq("import_record_id", importRecordId)
    results.push({
      name: "authenticated non-admin cannot read curation events",
      passed:
        !memberEventError &&
        Array.isArray(memberEvents) &&
        memberEvents.length === 0,
    })

    const { data: adminImports, error: adminImportReadError } =
      await adminSessionClient
        .from("resource_map_import_records")
        .select("id")
        .eq("id", importRecordId)
    results.push({
      name: "admin can read resource map import records",
      passed:
        !adminImportReadError &&
        Array.isArray(adminImports) &&
        adminImports.length === 1,
    })

    if (await tableExists("resource_map_public_items")) {
      const { data: publicItems, error: publicItemsError } = await anonClient
        .from("resource_map_public_items")
        .select("item_id,public_contacts,public_links")
        .eq("item_id", serviceId)
      const publicItem = publicItems?.[0]
      results.push({
        name: "anon can read sanitized approved resource map item",
        passed:
          !publicItemsError &&
          Array.isArray(publicItems) &&
          publicItems.length === 1,
      })
      results.push({
        name: "sanitized resource map item excludes private contacts and links",
        passed:
          Array.isArray(publicItem?.public_contacts) &&
          Array.isArray(publicItem?.public_links) &&
          publicItem.public_contacts.some(
            (contact) => contact.id === publicContactId
          ) &&
          !publicItem.public_contacts.some(
            (contact) => contact.id === privateContactId
          ) &&
          publicItem.public_links.some((link) => link.id === publicLinkId) &&
          !publicItem.public_links.some((link) => link.id === privateLinkId),
      })

      const { data: excludedItems, error: excludedItemsError } =
        await anonClient
          .from("resource_map_public_items")
          .select("item_id")
          .in("item_id", [
            serviceId,
            hiddenServiceId,
            suppressedServiceId,
            deletedServiceId,
          ])
      results.push({
        name: "sanitized resource map view excludes hidden suppressed and deleted services",
        passed:
          !excludedItemsError &&
          Array.isArray(excludedItems) &&
          excludedItems
            .map((item) => item.item_id)
            .sort()
            .join(",") === serviceId,
      })

      const { data: rpcItems, error: rpcError } = await anonClient.rpc(
        "get_resource_map_public_items",
        {
          p_query: "RLS Resource",
          p_category_keys: ["food"],
          p_limit: 10,
          p_latitude: 40.7128,
          p_longitude: -74.006,
          p_radius_miles: 25,
        }
      )
      results.push({
        name: "anon can call sanitized resource map RPC",
        passed:
          !rpcError &&
          Array.isArray(rpcItems) &&
          rpcItems.some((item) => item.item_id === serviceId),
      })
    } else {
      console.log(
        "SKIP resource map public read RLS tests: sanitized view/RPC migration is not applied to this Supabase database."
      )
    }

    await adminClient
      .from("resource_map_curation_events")
      .delete()
      .eq("import_record_id", importRecordId)
    await adminClient
      .from("resource_map_import_records")
      .delete()
      .eq("id", importRecordId)
    await adminClient
      .from("resource_map_organizations")
      .delete()
      .eq("id", orgId)
    await adminClient.from("resource_map_sources").delete().eq("id", sourceId)
  } else {
    console.log(
      "SKIP resource map RLS tests: resource map catalog migration is not applied to this Supabase database."
    )
  }

  if (await tableExists("public_map_organization_curation_events")) {
    const platformEventId = randomUUID()

    const { data: insertedEvent, error: eventInsertError } =
      await adminSessionClient
        .from("public_map_organization_curation_events")
        .insert({
          id: platformEventId,
          organization_id: member.id,
          actor_id: admin.id,
          action: "hide",
          reason: "RLS platform org hide fixture",
          before_state: { is_public: true },
          after_state: { is_public: false },
        })
        .select("id")
        .maybeSingle()
    results.push({
      name: "admin can write and read public map organization curation event",
      passed: !eventInsertError && insertedEvent?.id === platformEventId,
    })
    if (eventInsertError) throw eventInsertError

    const { data: anonEvents, error: anonEventError } = await anonClient
      .from("public_map_organization_curation_events")
      .select("id")
      .eq("id", platformEventId)
    results.push({
      name: "anon cannot read public map organization curation events",
      passed:
        !anonEventError && Array.isArray(anonEvents) && anonEvents.length === 0,
    })

    const { data: memberEvents, error: memberEventError } = await memberClient
      .from("public_map_organization_curation_events")
      .select("id")
      .eq("id", platformEventId)
    results.push({
      name: "authenticated non-admin cannot read public map organization curation events",
      passed:
        !memberEventError &&
        Array.isArray(memberEvents) &&
        memberEvents.length === 0,
    })

    const { error: memberInsertError } = await memberClient
      .from("public_map_organization_curation_events")
      .insert({
        organization_id: member.id,
        actor_id: member.id,
        action: "hide",
        reason: "RLS denied platform org hide fixture",
        before_state: { is_public: true },
        after_state: { is_public: false },
      })
    results.push({
      name: "authenticated non-admin cannot write public map organization curation events",
      passed: Boolean(memberInsertError),
    })

    await adminClient
      .from("public_map_organization_curation_events")
      .delete()
      .eq("id", platformEventId)
  } else {
    console.log("SKIP org curation RLS: audit migration missing.")
  }
}

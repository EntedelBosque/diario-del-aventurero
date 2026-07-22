#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "iltknfdoiwiunvezprdy";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY);

async function diagnose() {
  try {
    console.log("🔍 Diagnosing Motor Effects Persistence Issues\n");

    // Get the latest test results
    const { data: activities } = await client
      .from("activity_progress_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (activities && activities.length > 0) {
      const activity = activities[0];
      console.log("📌 Latest activity_progress_record:");
      console.log(`   Player ID: ${activity.player_id}`);
      console.log(`   Source Event ID: ${activity.source_event_id}\n`);

      // Check contract_evidence for this world event
      const { data: contractEvidence } = await client
        .from("contract_evidence")
        .select("*")
        .eq("world_event_id", activity.source_event_id);

      console.log(`📌 contract_evidence for world_event_id ${activity.source_event_id}:`);
      console.log(`   Count: ${contractEvidence?.length || 0}`);
      if (contractEvidence && contractEvidence.length > 0) {
        console.log("   Records:", contractEvidence);
      }
      console.log();

      // Check boss_evidence_log for this world event
      const { data: bossEvidence } = await client
        .from("boss_evidence_log")
        .select("*")
        .eq("source_event_id", activity.source_event_id);

      console.log(`📌 boss_evidence_log for world_event_id ${activity.source_event_id}:`);
      console.log(`   Count: ${bossEvidence?.length || 0}`);
      if (bossEvidence && bossEvidence.length > 0) {
        console.log("   Records:", bossEvidence);
      }
      console.log();

      // Check boss_damage_history for this world event
      const { data: bossDamage } = await client
        .from("boss_damage_history")
        .select("*")
        .eq("world_event_id", activity.source_event_id);

      console.log(`📌 boss_damage_history for world_event_id ${activity.source_event_id}:`);
      console.log(`   Count: ${bossDamage?.length || 0}`);
      if (bossDamage && bossDamage.length > 0) {
        console.log("   Records:", bossDamage);
      }
      console.log();

      // Check contract_history for any records
      const { data: contractHistory } = await client
        .from("contract_history")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(5);

      console.log("📌 Latest contract_history records:");
      console.log(`   Count (last 5): ${contractHistory?.length || 0}`);
      if (contractHistory && contractHistory.length > 0) {
        contractHistory.forEach((ch) => {
          console.log(`   - Contract ${ch.contract_id}: ${ch.previous_state} -> ${ch.next_state}`);
        });
      }
      console.log();

      // Check motor_runs to see what effects were recorded
      const { data: motorRuns } = await client
        .from("motor_runs")
        .select("*")
        .eq("world_event_id", activity.source_event_id);

      console.log(`📌 motor_runs for world_event_id ${activity.source_event_id}:`);
      console.log(`   Count: ${motorRuns?.length || 0}`);
      if (motorRuns && motorRuns.length > 0) {
        const mr = motorRuns[0];
        console.log("   Effects:");
        console.log(`   - contractEvidence count: ${mr.effects?.contractEvidence?.length || 0}`);
        console.log(`   - bossEvidence count: ${mr.effects?.bossEvidence?.length || 0}`);
        console.log(`   - activities count: ${mr.effects?.activities?.length || 0}`);
        if (mr.effects?.contractEvidence && mr.effects.contractEvidence.length > 0) {
          console.log(`   - Contract IDs: ${mr.effects.contractEvidence.map((ce) => ce.contractId).join(", ")}`);
        }
        if (mr.effects?.bossEvidence && mr.effects.bossEvidence.length > 0) {
          console.log(`   - Boss IDs: ${mr.effects.bossEvidence.map((be) => be.bossId).join(", ")}`);
        }
      }

      console.log("\n✅ Diagnostic complete");
    } else {
      console.log("❌ No activity_progress_records found");
    }
  } catch (error) {
    console.error("❌ Diagnosis failed:", error);
    process.exit(1);
  }
}

diagnose();

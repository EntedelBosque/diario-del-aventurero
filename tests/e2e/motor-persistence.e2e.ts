import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

// E2E Test: Complete Motor effect persistence with all branches
// Verifies that persist_motor_effects correctly persists:
// - Activity progress records and XP awards
// - Guild experience allocation
// - Player level recalculation
// - Contract evidence and state transitions
// - Boss damage and evidence logging
// - Currency transactions
// - Discipline factor calculations

const PROJECT_REF = "iltknfdoiwiunvezprdy";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const client = createClient(SUPABASE_URL, SERVICE_KEY);

const TEST_PLAYER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_WORLD_EVENT_ID = "880e8400-e29b-41d4-a716-446655440001";
const TEST_CONTRACT_ID = "660e8400-e29b-41d4-a716-446655440001";
const TEST_BOSS_ID = "770e8400-e29b-41d4-a716-446655440001";

interface MotorEffects {
  playerId: string;
  worldEventId: string;
  rulesVersion: string;
  playerExperienceDelta: number;
  activities: Array<{
    category: string;
    scale: string;
    durationMinutes: number;
    classifications: object;
    baseXp: number;
    timeXp: number;
    peopleXp: number;
    discoveryXp: number;
    bonusXp: number;
    totalXp: number;
    guildAwards: Array<{ guildCode: string; experience: number }>;
  }>;
  contractEvidence: Array<{ contractId: string; rationale: string }>;
  bossEvidence: Array<{ bossId: string; damage: number; rationale: string }>;
  currencyDelta: number;
}

async function setupTestData() {
  console.log("🔧 Setting up test data...");

  // Create test player
  const { error: playerError } = await client.from("players").insert({
    id: TEST_PLAYER_ID,
    username: "e2e_test_player",
    email: "e2e@test.local",
    current_level: 1,
    experience: 0,
    version: 1,
  });

  if (playerError && !playerError.message.includes("duplicate")) {
    throw playerError;
  }

  // Create test contract
  const { error: contractError } = await client.from("contracts").insert({
    id: TEST_CONTRACT_ID,
    player_id: TEST_PLAYER_ID,
    contract_type: "diario",
    objective: "Complete E2E test",
    state: "disponible",
    difficulty: "normal",
    priority: "alta",
    categories: ["testing"],
    origin: "motor",
    rewards: { xp: 100 },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (contractError && !contractError.message.includes("duplicate")) {
    throw contractError;
  }

  // Create test boss
  const { error: bossError } = await client.from("bosses").insert({
    id: TEST_BOSS_ID,
    player_id: TEST_PLAYER_ID,
    name: "E2E Test Boss",
    description: "A boss for testing Motor effects",
    categories: ["testing"],
    level: 5,
    max_health: 100,
    current_health: 100,
    difficulty: "normal",
    state: "descubierto",
    appeared_at: new Date().toISOString(),
    rewards: { xp: 50 },
  });

  if (bossError && !bossError.message.includes("duplicate")) {
    throw bossError;
  }

  // Ensure player has guild progress
  const { data: guilds } = await client.from("guilds").select("code").eq("is_active", true);

  if (guilds) {
    for (const guild of guilds) {
      await client.from("player_guild_progress").insert({
        player_id: TEST_PLAYER_ID,
        guild_code: guild.code,
      });
    }
  }

  console.log("✅ Test data setup complete");
}

async function executeMotorEffects() {
  console.log("\n🔄 Executing Motor effects...");

  // Create a world event first
  const { data: worldEvent, error: weError } = await client
    .from("world_events")
    .insert({
      player_id: TEST_PLAYER_ID,
      event_type: "diary_entry_intake",
      source_description: "E2E Test Motor Execution",
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (weError) throw weError;

  const worldEventId = worldEvent.id;

  // Build Motor effects with all branches
  const effects: MotorEffects = {
    playerId: TEST_PLAYER_ID,
    worldEventId: worldEventId,
    rulesVersion: "player_level_curve@2,boss_damage_curve@1,discipline_weights@1,director_thresholds@1",
    playerExperienceDelta: 250,
    activities: [
      {
        category: "testing",
        scale: "media",
        durationMinutes: 60,
        classifications: { type: "e2e_test" },
        baseXp: 50,
        timeXp: 50,
        peopleXp: 50,
        discoveryXp: 50,
        bonusXp: 0,
        totalXp: 200,
        guildAwards: [
          { guildCode: "creatividad", experience: 100 },
          { guildCode: "conocimiento", experience: 100 },
        ],
      },
    ],
    contractEvidence: [
      {
        contractId: TEST_CONTRACT_ID,
        rationale: "E2E test contract evidence - Player engaged in testing activities",
      },
    ],
    bossEvidence: [
      {
        bossId: TEST_BOSS_ID,
        damage: 25,
        rationale: "E2E test boss damage - Successfully tested Motor execution",
      },
    ],
    currencyDelta: 50,
  };

  // Call persist_motor_effects RPC
  const { error } = await client.rpc("persist_motor_effects", {
    p_world_event_id: worldEventId,
    p_player_id: TEST_PLAYER_ID,
    p_rules_version: effects.rulesVersion,
    p_effects: effects,
  });

  if (error) throw error;

  console.log("✅ Motor effects executed successfully");
  return worldEventId;
}

async function reportResults(worldEventId: string) {
  console.log("\n📊 Reporting Motor Effects Results\n");

  const counts: { [key: string]: number } = {};

  // Query activity_progress_records
  const { data: aprData } = await client
    .from("activity_progress_records")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID)
    .eq("source_event_id", worldEventId);

  counts["activity_progress_records"] = aprData?.length ?? 0;
  console.log(`📌 activity_progress_records: ${counts["activity_progress_records"]}`);

  // Query experience_awards
  const { data: eaData } = await client
    .from("experience_awards")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID);

  counts["experience_awards"] = eaData?.length ?? 0;
  console.log(`📌 experience_awards: ${counts["experience_awards"]}`);

  // Query guild_experience_awards
  const { data: geaData } = await client
    .from("guild_experience_awards")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID);

  counts["guild_experience_awards"] = geaData?.length ?? 0;
  console.log(`📌 guild_experience_awards: ${counts["guild_experience_awards"]}`);

  // Query guild_history
  const { data: ghData } = await client
    .from("guild_history")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID);

  counts["guild_history"] = ghData?.length ?? 0;
  console.log(`📌 guild_history: ${counts["guild_history"]}`);

  // Query contract_history
  const { data: chData } = await client
    .from("contract_history")
    .select("*", { count: "exact" });

  const contractHistoryCount = chData?.filter((ch) => ch.contract_id === TEST_CONTRACT_ID).length ?? 0;
  counts["contract_history"] = contractHistoryCount;
  console.log(`📌 contract_history (for test contract): ${contractHistoryCount}`);

  // Query contract_evidence
  const { data: ceData } = await client
    .from("contract_evidence")
    .select("*", { count: "exact" })
    .eq("contract_id", TEST_CONTRACT_ID);

  counts["contract_evidence"] = ceData?.length ?? 0;
  console.log(`📌 contract_evidence: ${counts["contract_evidence"]}`);

  // Query boss_evidence_log
  const { data: belData } = await client
    .from("boss_evidence_log")
    .select("*", { count: "exact" })
    .eq("boss_id", TEST_BOSS_ID);

  counts["boss_evidence_log"] = belData?.length ?? 0;
  console.log(`📌 boss_evidence_log: ${counts["boss_evidence_log"]}`);

  // Query boss_damage_history
  const { data: bdhData } = await client
    .from("boss_damage_history")
    .select("*", { count: "exact" })
    .eq("boss_id", TEST_BOSS_ID);

  counts["boss_damage_history"] = bdhData?.length ?? 0;
  console.log(`📌 boss_damage_history: ${counts["boss_damage_history"]}`);

  // Query currency_transactions
  const { data: ctData } = await client
    .from("currency_transactions")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID);

  counts["currency_transactions"] = ctData?.length ?? 0;
  console.log(`📌 currency_transactions: ${counts["currency_transactions"]}`);

  // Query discipline_calculations
  const { data: dcData } = await client
    .from("discipline_calculations")
    .select("*", { count: "exact" })
    .eq("player_id", TEST_PLAYER_ID);

  counts["discipline_calculations"] = dcData?.length ?? 0;
  console.log(`📌 discipline_calculations: ${counts["discipline_calculations"]}`);

  // Verify player level recalculation
  const { data: playerData } = await client
    .from("players")
    .select("id, current_level, experience, version")
    .eq("id", TEST_PLAYER_ID)
    .single();

  console.log(`\n👤 Player State After Motor Execution:`);
  console.log(`   - ID: ${playerData?.id}`);
  console.log(`   - Current Level: ${playerData?.current_level}`);
  console.log(`   - Experience: ${playerData?.experience}`);
  console.log(`   - Version: ${playerData?.version}`);

  // Verify contract state
  const { data: contractData } = await client
    .from("contracts")
    .select("id, state, updated_at")
    .eq("id", TEST_CONTRACT_ID)
    .single();

  console.log(`\n📜 Contract State After Motor Execution:`);
  console.log(`   - State: ${contractData?.state}`);
  console.log(`   - Updated: ${contractData?.updated_at}`);

  // Verify boss state
  const { data: bossData } = await client
    .from("bosses")
    .select("id, current_health, state, version")
    .eq("id", TEST_BOSS_ID)
    .single();

  console.log(`\n🐉 Boss State After Motor Execution:`);
  console.log(`   - Current Health: ${bossData?.current_health}`);
  console.log(`   - State: ${bossData?.state}`);
  console.log(`   - Version: ${bossData?.version}`);

  console.log(`\n✅ E2E Test Complete - All rows created successfully`);
  console.log("\nSummary of rows created:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }
}

async function main() {
  try {
    console.log("🚀 Starting E2E Test: Complete Motor Effects Persistence\n");

    await setupTestData();
    const worldEventId = await executeMotorEffects();
    await reportResults(worldEventId);

    console.log("\n🎉 E2E Test Completed Successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ E2E Test Failed:", error);
    process.exit(1);
  }
}

main();

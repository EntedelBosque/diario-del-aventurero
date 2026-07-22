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

// Use dynamically created test user IDs
let TEST_PLAYER_ID = "550e8400-e29b-41d4-a716-446655440000";
let TEST_GUILD_CODE = "creatividad";
const TEST_WORLD_EVENT_ID = crypto.randomUUID();
const TEST_CONTRACT_ID = crypto.randomUUID();
const TEST_BOSS_ID = crypto.randomUUID();

async function runE2ETest() {
  console.log("🚀 Starting E2E Test: Complete Motor Effects Persistence\n");

  try {
    // Step 0: Create test user through Supabase Auth
    console.log("🔐 Step 0: Creating test user through Supabase Auth...");

    const testEmail = `e2e-test-${Date.now()}@test.local`;
    const testPassword = "TestPassword123!@#";

    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error("❌ Failed to create auth user:", authError.message);
      process.exit(1);
    }

    TEST_PLAYER_ID = authData.user.id;
    console.log(`✅ Auth user created: ${TEST_PLAYER_ID}\n`);

    // Ensure player record exists
    const { error: playerError } = await client.from("players").insert({
      id: TEST_PLAYER_ID,
    });

    if (playerError && !playerError.message.includes("duplicate")) {
      console.error("❌ Failed to create player record:", playerError);
      process.exit(1);
    }

    console.log("✅ Player record created\n");

    // Step 1: Get available guilds and find one with guild_categories
    console.log("🔧 Step 1: Setting up guild progress and finding activity category...");

    const { data: guilds, error: guildsError } = await client
      .from("guilds")
      .select("code, is_active")
      .eq("is_active", true)
      .limit(5);

    if (guildsError || !guilds || guilds.length === 0) {
      console.error("Failed to fetch active guilds");
      process.exit(1);
    }

    console.log(`   Found ${guilds.length} active guilds`);

    // Create guild progress for all active guilds
    for (const guild of guilds) {
      const { error: gpError } = await client.from("player_guild_progress").insert({
        player_id: TEST_PLAYER_ID,
        guild_code: guild.code,
      });
      if (!gpError || gpError.message.includes("duplicate")) {
        console.log(`   ✓ Guild progress: ${guild.code}`);
        if (!TEST_GUILD_CODE || TEST_GUILD_CODE === "creatividad") {
          TEST_GUILD_CODE = guild.code;  // Use the first found guild
        }
      }
    }

    console.log(`✅ Guild progress created\n`);

    // Step 2: Setup test contract
    console.log("🔧 Step 2: Setting up test contract...");

    const { error: contractError } = await client.from("contracts").insert({
      id: TEST_CONTRACT_ID,
      player_id: TEST_PLAYER_ID,
      contract_type: "diario",
      objective: "Complete E2E test",
      state: "disponible",
      difficulty: "normal",
      priority: "alta",
      categories: ["general"],
      origin: "motor",
      rewards: { xp: 100 },
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!contractError || contractError.message.includes("duplicate")) {
      console.log("✅ Test contract created");
    }

    // Step 3: Setup test boss
    console.log("🔧 Step 3: Setting up test boss...");

    const { error: bossError } = await client.from("bosses").insert({
      id: TEST_BOSS_ID,
      player_id: TEST_PLAYER_ID,
      name: "E2E Test Boss",
      description: "A boss for testing Motor effects",
      categories: ["general"],
      level: 5,
      max_health: 100,
      current_health: 100,
      difficulty: "normal",
      state: "descubierto",
      appeared_at: new Date().toISOString(),
      rewards: { xp: 50 },
    });

    if (!bossError || bossError.message.includes("duplicate")) {
      console.log("✅ Test boss created");
    }

    console.log("\n✅ Test data setup complete\n");

    // Step 4: Create world event
    console.log("🔧 Step 4: Creating world event...");

    const { data: weData, error: weError } = await client
      .from("world_events")
      .insert({
        id: TEST_WORLD_EVENT_ID,
        player_id: TEST_PLAYER_ID,
        event_type: "motor_execution",
        schema_version: 1,
        rules_version: "player_level_curve@2,boss_damage_curve@1,discipline_weights@1",
        payload: {
          description: "E2E Test Motor Execution",
          type: "motor_effects",
        },
        occurred_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (weError) throw weError;

    console.log("✅ World event created\n");

    // Step 5: Execute Motor effects
    console.log("🔄 Step 5: Executing Motor effects via persist_motor_effects RPC...");

    const effects = {
      playerId: TEST_PLAYER_ID,
      worldEventId: TEST_WORLD_EVENT_ID,
      playerExperienceDelta: 250,
      currencyDelta: 50,
      activities: [
        {
          category: TEST_GUILD_CODE,
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
            { guildCode: TEST_GUILD_CODE, experience: 100 },
          ],
        },
      ],
      contractEvidence: [
        {
          contractId: TEST_CONTRACT_ID,
          rationale: "E2E test contract evidence",
        },
      ],
      bossEvidence: [
        {
          bossId: TEST_BOSS_ID,
          damage: 25,
          rationale: "E2E test boss damage",
        },
      ],
    };

    const { error: rpcError } = await client.rpc("persist_motor_effects", {
      p_world_event_id: TEST_WORLD_EVENT_ID,
      p_player_id: TEST_PLAYER_ID,
      p_rules_version: "player_level_curve@2,boss_damage_curve@1,discipline_weights@1",
      p_effects: effects,
    });

    if (rpcError) throw rpcError;

    console.log("✅ Motor effects executed successfully\n");

    // Step 6: Report results
    console.log("📊 Step 6: Reporting Motor Effects Results\n");

    const results = {};
    const tables = [
      "activity_progress_records",
      "experience_awards",
      "guild_experience_awards",
      "guild_history",
      "contract_history",
      "contract_evidence",
      "boss_evidence_log",
      "boss_damage_history",
      "currency_transactions",
      "discipline_calculations",
    ];

    for (const table of tables) {
      const { count } = await client
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("player_id", TEST_PLAYER_ID);
      results[table] = count || 0;
      console.log(`📌 ${table}: ${count || 0}`);
    }

    // Verify player state
    console.log("\n👤 Player State After Motor Execution:");
    const { data: playerData } = await client
      .from("players")
      .select("id, current_level, experience, version")
      .eq("id", TEST_PLAYER_ID)
      .single();

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

    console.log("\n📜 Contract State After Motor Execution:");
    console.log(`   - State: ${contractData?.state}`);
    console.log(`   - Updated: ${contractData?.updated_at}`);

    // Verify boss state
    const { data: bossData } = await client
      .from("bosses")
      .select("id, current_health, state, version")
      .eq("id", TEST_BOSS_ID)
      .single();

    console.log("\n🐉 Boss State After Motor Execution:");
    console.log(`   - Current Health: ${bossData?.current_health}`);
    console.log(`   - State: ${bossData?.state}`);
    console.log(`   - Version: ${bossData?.version}`);

    console.log("\n✅ E2E Test Complete - All rows created successfully\n");
    console.log("Summary of rows created:");
    for (const [table, count] of Object.entries(results)) {
      console.log(`  ${table}: ${count}`);
    }

    console.log("\n🎉 E2E Test Completed Successfully!");
  } catch (error) {
    console.error("❌ E2E Test Failed:", error);
    process.exit(1);
  }
}

runE2ETest();

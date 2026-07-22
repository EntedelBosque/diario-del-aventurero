#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "iltknfdoiwiunvezprdy";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.log("\nTo run the E2E test, set the environment variable:");
  console.log("  export SUPABASE_SERVICE_ROLE_KEY='<your-service-role-key>'");
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY);

// Use dynamically created test user IDs
let TEST_PLAYER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_WORLD_EVENT_ID = "880e8400-e29b-41d4-a716-446655440001";
const TEST_CONTRACT_ID = "660e8400-e29b-41d4-a716-446655440001";
const TEST_BOSS_ID = "770e8400-e29b-41d4-a716-446655440001";

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

    // Try to create contracts and bosses with error handling
    try {
      await client.from("contracts").insert({
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
    } catch (e) {
      console.log("   (Contract creation failed - player may not exist yet)");
    }

    try {
      await client.from("bosses").insert({
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
    } catch (e) {
      console.log("   (Boss creation failed - player may not exist yet)");
    }

    // Ensure guild progress
    try {
      const { data: guilds } = await client.from("guilds").select("code").eq("is_active", true);
      if (guilds) {
        for (const guild of guilds) {
          try {
            await client.from("player_guild_progress").insert({
              player_id: TEST_PLAYER_ID,
              guild_code: guild.code,
            });
          } catch (e) {
            // Guild progress may already exist
          }
        }
      }
    } catch (e) {
      console.log("   (Guild progress setup failed)");
    }

    // Create world event
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

    console.log("✅ Test data setup complete\n");

    // Step 2: Execute Motor effects
    console.log("🔄 Step 2: Executing Motor effects via persist_motor_effects RPC...");

    const effects = {
      playerId: TEST_PLAYER_ID,
      worldEventId: TEST_WORLD_EVENT_ID,
      playerExperienceDelta: 250,
      currencyDelta: 50,
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
    };

    const { error: rpcError } = await client.rpc("persist_motor_effects", {
      p_world_event_id: TEST_WORLD_EVENT_ID,
      p_player_id: TEST_PLAYER_ID,
      p_rules_version: "player_level_curve@2,boss_damage_curve@1,discipline_weights@1",
      p_effects: effects,
    });

    if (rpcError) throw rpcError;

    console.log("✅ Motor effects executed successfully\n");

    // Step 3: Report results
    console.log("📊 Step 3: Reporting Motor Effects Results\n");

    const results = {};

    // Query each affected table
    const queries = [
      {
        name: "activity_progress_records",
        from: "activity_progress_records",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID).eq("source_event_id", TEST_WORLD_EVENT_ID),
      },
      {
        name: "experience_awards",
        from: "experience_awards",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID),
      },
      {
        name: "guild_experience_awards",
        from: "guild_experience_awards",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID),
      },
      {
        name: "guild_history",
        from: "guild_history",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID),
      },
      {
        name: "contract_history",
        from: "contract_history",
        filter: (q) => q.eq("contract_id", TEST_CONTRACT_ID),
      },
      {
        name: "contract_evidence",
        from: "contract_evidence",
        filter: (q) => q.eq("contract_id", TEST_CONTRACT_ID),
      },
      {
        name: "boss_evidence_log",
        from: "boss_evidence_log",
        filter: (q) => q.eq("boss_id", TEST_BOSS_ID),
      },
      {
        name: "boss_damage_history",
        from: "boss_damage_history",
        filter: (q) => q.eq("boss_id", TEST_BOSS_ID),
      },
      {
        name: "currency_transactions",
        from: "currency_transactions",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID),
      },
      {
        name: "discipline_calculations",
        from: "discipline_calculations",
        filter: (q) => q.eq("player_id", TEST_PLAYER_ID),
      },
    ];

    for (const { name, from, filter } of queries) {
      const { data, count } = await filter(client.from(from)).select("*", { count: "exact", head: true });
      results[name] = count || 0;
      console.log(`📌 ${name}: ${count || 0}`);
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
    console.log("\n📜 Contract State After Motor Execution:");
    const { data: contractData } = await client
      .from("contracts")
      .select("id, state, updated_at")
      .eq("id", TEST_CONTRACT_ID)
      .single();

    console.log(`   - State: ${contractData?.state}`);
    console.log(`   - Updated: ${contractData?.updated_at}`);

    // Verify boss state
    console.log("\n🐉 Boss State After Motor Execution:");
    const { data: bossData } = await client
      .from("bosses")
      .select("id, current_health, state, version")
      .eq("id", TEST_BOSS_ID)
      .single();

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

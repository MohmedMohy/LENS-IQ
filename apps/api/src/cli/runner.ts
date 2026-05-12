import { evaluateApplication } from "../engine/index.js";
import { compareOffers } from "../engine/index.js";
import { rankOffers } from "../engine/index.js";

import { testInput } from "./fixtures.js";
import { createTestProgram } from "./factories/programFactory.js";

async function run() {
    console.log("\n🚀 ENGINE TEST RUN STARTED\n");

    // =========================
    // CREATE PROGRAM INSTANCE
    // =========================
    const testProgram = createTestProgram();

    // =========================
    // 1. SINGLE EVALUATION
    // =========================
    console.log("📊 STEP 1: Evaluation\n");

    const evaluation = await evaluateApplication(
        testInput,
        testProgram,
        1
    );

    console.dir(evaluation, { depth: null });

    // =========================
    // 2. OFFER GENERATION
    // =========================
    console.log("\n💰 STEP 2: Offer Generation\n");

    const offers = await compareOffers(
        testInput,
        [testProgram],
        1
    );

    console.dir(offers, { depth: null });

    // =========================
    // 3. RANKING
    // =========================
    console.log("\n🏆 STEP 3: Ranking\n");

    const ranked = rankOffers(offers);

    console.dir(ranked, { depth: null });

    console.log("\n✅ ENGINE TEST COMPLETE\n");
}

run().catch((err) => {
    console.error("❌ ERROR IN ENGINE TEST:", err);
});
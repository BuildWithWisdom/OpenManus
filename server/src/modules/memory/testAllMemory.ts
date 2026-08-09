import 'dotenv/config';
import { execSync } from 'child_process';

async function testAll() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPLETE GOHARD MEMORY ENGINE VERIFICATION SUITE');
  console.log('================================================================\n');

  const tests = [
    { name: '1. Core Memory CRUD (testMemory.ts)', cmd: 'npx tsx src/modules/memory/testMemory.ts' },
    { name: '2. Analyst AI Engine (testAnalystEngine.ts)', cmd: 'npx tsx src/modules/memory/testAnalystEngine.ts' },
    { name: '3. Vector Embeddings & Semantic Store (testSemanticMemory.ts)', cmd: 'npx tsx src/modules/memory/testSemanticMemory.ts' },
    { name: '4. End-to-End Adaptive Teaching Loop (testAdaptiveLoop.ts)', cmd: 'npx tsx src/modules/memory/testAdaptiveLoop.ts' },
  ];

  let passedCount = 0;

  for (const t of tests) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`▶ Executing: ${t.name}`);
    console.log(`----------------------------------------------------------------`);
    try {
      execSync(t.cmd, { stdio: 'inherit', cwd: '/home/aguowisdom/Projects/OpenManus/server' });
      passedCount++;
    } catch (err) {
      console.error(`❌ Suite Failed: ${t.name}`);
      process.exit(1);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedCount}/${tests.length} TEST SUITES PASSED CLEANLY!`);
  console.log('================================================================\n');
}

testAll().catch(console.error);

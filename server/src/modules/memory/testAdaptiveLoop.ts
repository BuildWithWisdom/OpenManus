import 'dotenv/config';
import { memoryManager } from './memoryManager';
import { buildSystemPrompt } from '../../prompts/promptBuilder';
import { prisma } from '../../db/client';

async function testAdaptiveLoop() {
  console.log('=== 🧠 Testing Phase 6 Adaptive Teaching Loop (End-to-End) ===\n');

  const testUserId = 'user-adaptive-loop-test';
  const testCourseId = 'course-react-hooks-mastery';

  if (process.env.DATABASE_URL) {
    await prisma.user.upsert({
      where: { id: testUserId },
      create: { id: testUserId, email: `${testUserId}@gohard.ai`, name: 'Adaptive Tester', passwordHash: '$2a$10$defaultMockPasswordHashForLegacySystemUser' },
      update: {},
    });

    await prisma.course.upsert({
      where: { id: testCourseId },
      create: { id: testCourseId, userId: testUserId, title: 'React Hooks Mastery', description: 'Advanced Hooks' },
      update: {},
    });
  }

  // 1. Initial State: Build System Prompt for Interaction 1
  console.log('1. Interaction 1: Student opens Lesson 1 (Initial Memory State)...');
  const initialMemoryContext = await memoryManager.buildMemoryContext({
    userId: testUserId,
    courseId: testCourseId,
  });

  const initialSystemPrompt = buildSystemPrompt({
    personaId: 'coding_architect',
    memoryContext: initialMemoryContext,
  });

  console.log('Initial System Prompt contains <learner_memory_context>:', initialSystemPrompt.includes('<learner_memory_context>') ? 'YES ✅' : 'NO ❌');

  // 2. Simulate Analyst AI observation after Interaction 1
  console.log('\n2. Simulating Background Analyst Engine Observation after Lesson 1...');
  await memoryManager.updateCourseMemory(testUserId, testCourseId, {
    courseGoal: 'Build high-performance React dashboard',
    courseWeaknesses: ['React State Immutability'],
    masteredConcepts: ['useState basics'],
  });

  await memoryManager.saveSemanticMemory({
    userId: testUserId,
    courseId: testCourseId,
    category: 'EXPLANATION',
    concept: 'React State Immutability',
    content: 'Analogy: Never mutate React state objects directly; treat state objects like frozen records and create new updated copies.',
  });

  console.log('Recorded course weakness and semantic memory in NeonDB.');

  // 3. Interaction 2: Student asks question in Lesson 2
  console.log('\n3. Interaction 2: Student asks question in Lesson 2...');
  const userQuestion = 'How do I safely update an array of objects inside React state?';

  const adaptedMemoryContext = await memoryManager.buildMemoryContext({
    userId: testUserId,
    courseId: testCourseId,
    query: userQuestion,
  });

  const adaptedSystemPrompt = buildSystemPrompt({
    personaId: 'coding_architect',
    memoryContext: adaptedMemoryContext,
  });

  console.log('\n--- Adapted System Prompt Output (Lesson 2) ---');
  console.log(adaptedSystemPrompt);
  console.log('------------------------------------------------');

  const containsWeakness = adaptedSystemPrompt.includes('React State Immutability');
  const containsGoal = adaptedSystemPrompt.includes('Build high-performance React dashboard');
  const containsSemanticMemory = adaptedSystemPrompt.includes('semantic_past_explanations');

  console.log('\nVerification Checkpoints:');
  console.log('- Automatically retrieved course goal:', containsGoal ? 'PASSED ✅' : 'FAILED ❌');
  console.log('- Automatically retrieved course weakness:', containsWeakness ? 'PASSED ✅' : 'FAILED ❌');
  console.log('- Automatically matched semantic past explanation:', containsSemanticMemory ? 'PASSED ✅' : 'FAILED ❌');

  if (containsWeakness && containsGoal && containsSemanticMemory) {
    console.log('\n🎉 Phase 6 Adaptive Teaching Loop Verified Successfully!');
  } else {
    throw new Error('Adaptive teaching loop verification failed.');
  }
}

testAdaptiveLoop().catch(console.error);

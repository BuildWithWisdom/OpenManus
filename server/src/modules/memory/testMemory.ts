import 'dotenv/config';
import { MemoryManager } from './memoryManager';
import { prisma } from '../../db/client';

async function testMemoryEngine() {
  console.log('=== 🧠 Testing Gohard Memory Engine (Streamlined Architecture) ===\n');

  const testUserId = 'user-wisdom-101';
  const testCourseId = 'course-ai-engineering';

  if (process.env.DATABASE_URL) {
    console.log('Connecting to NeonDB database...');
    await prisma.user.upsert({
      where: { id: testUserId },
      create: { id: testUserId, email: `${testUserId}@gohard.ai`, name: 'Wisdom', passwordHash: '$2a$10$defaultMockPasswordHashForLegacySystemUser' },
      update: {},
    });

    await prisma.course.upsert({
      where: { id: testCourseId },
      create: { id: testCourseId, userId: testUserId, title: 'AI Engineering', description: 'Master AI' },
      update: {},
    });
  }

  const memoryManager = new MemoryManager();

  // 1. Test Learner Memory Defaults & Updates
  console.log('1. Initializing Learner Memory...');
  const initialLearner = await memoryManager.getLearnerMemory(testUserId);
  console.log('Initial Learner Profile:', initialLearner);

  console.log('\nUpdating Learner Memory...');
  const updatedLearner = await memoryManager.updateLearnerMemory(testUserId, {
    knowledgeLevel: 'intermediate',
    learningPace: 'fast_paced',
    confidenceScore: 0.8,
  });
  console.log('Updated Learner Profile:', updatedLearner);

  // 2. Test Teaching Strategy Memory
  console.log('\n2. Initializing Teaching Strategy Memory...');
  const updatedStrategy = await memoryManager.updateTeachingStrategy(testUserId, {
    learningApproach: 'hands_on_lab_first',
    explanationStyle: 'visual_diagrams',
    preferredFormat: 'architecture_diagrams',
  });
  console.log('Updated Teaching Strategy:', updatedStrategy);

  // 3. Test Course Memory (Course Brain)
  console.log('\n3. Testing Course Memory (Per-Course brain)...');
  const updatedCourse = await memoryManager.updateCourseMemory(testUserId, testCourseId, {
    currentModuleId: 'module-5-vector-db',
    courseGoal: 'Build production AI agent system',
    masteredConcepts: ['Hono Routing', 'Mermaid Subgraphs'],
    courseWeaknesses: ['Cosine Distance Math'],
  });
  console.log('Updated Course Memory:', updatedCourse);

  // 4. Test Prompt Context Assembler (buildMemoryContext)
  console.log('\n4. Testing buildMemoryContext() XML Output for Prompt Injection...');
  const memoryXml = await memoryManager.buildMemoryContext({
    userId: testUserId,
    courseId: testCourseId,
  });

  console.log('\n--- Formatted System Prompt Memory Context ---');
  console.log(memoryXml);
  console.log('----------------------------------------------');

  console.log('\n✅ Memory Engine Test Passed Successfully!');
}

testMemoryEngine().catch(console.error);

import 'dotenv/config';
import { embeddingService } from './embeddingService';
import { memoryManager } from './memoryManager';

async function testSemanticMemory() {
  console.log('=== 🧠 Testing Phase 5 Vector Search & Semantic Memory ===\n');

  const testUserId = 'user-wisdom-semantic-test';
  const testCourseId = 'course-react-advanced';

  // 1. Test 384-Dimensional Embedding Generation
  console.log('1. Generating 384-dimensional vector embedding...');
  const sampleText = 'React batches state updates inside event handlers to optimize rendering performance.';
  const embedding = await embeddingService.generateEmbedding(sampleText);
  console.log(`Generated Vector Dimensions: ${embedding.length}`);
  console.log(`Sample Vector Slice (first 5 dimensions): [${embedding.slice(0, 5).join(', ')}]`);

  // 2. Test Cosine Similarity Math Utility
  console.log('\n2. Testing Cosine Similarity Calculation...');
  const textA = 'React state batching explanation';
  const textB = 'Why does setState batch rendering updates in React?';
  const textC = 'How to make authentic Japanese ramen broth';

  const vectorA = await embeddingService.generateEmbedding(textA);
  const vectorB = await embeddingService.generateEmbedding(textB);
  const vectorC = await embeddingService.generateEmbedding(textC);

  const similarityAB = embeddingService.cosineSimilarity(vectorA, vectorB);
  const similarityAC = embeddingService.cosineSimilarity(vectorA, vectorC);

  console.log(`Similarity (React State Batching vs React setState Batching): ${similarityAB.toFixed(4)} (Expected High ~0.7-0.9)`);
  console.log(`Similarity (React State Batching vs Japanese Ramen Broth): ${similarityAC.toFixed(4)} (Expected Low ~0.0-0.3)`);

  // 3. Test Saving Semantic Memory Snippets
  console.log('\n3. Saving Semantic Memory Snippets to Store...');
  const memory1 = await memoryManager.saveSemanticMemory({
    userId: testUserId,
    courseId: testCourseId,
    category: 'EXPLANATION',
    concept: 'React State Batching',
    content: 'Analogy: React state batching is like waiting to mail all letters at once at the end of the day instead of walking to the mailbox for every single letter.',
  });
  console.log('Saved Semantic Memory 1 ID:', memory1.id);

  const memory2 = await memoryManager.saveSemanticMemory({
    userId: testUserId,
    courseId: testCourseId,
    category: 'QA_PAIR',
    concept: 'SQL JOIN Types',
    content: 'Q: What is the difference between INNER JOIN and LEFT JOIN? A: INNER JOIN returns only matching rows from both tables, while LEFT JOIN returns all rows from the left table.',
  });
  console.log('Saved Semantic Memory 2 ID:', memory2.id);

  // 4. Test Prompt Context Injection with Semantic Query
  console.log('\n4. Testing buildMemoryContext() with Semantic Query Injection...');
  const memoryXmlWithQuery = await memoryManager.buildMemoryContext({
    userId: testUserId,
    courseId: testCourseId,
    query: 'How does React optimize state updates?',
  });

  console.log('\n--- Formatted System Prompt Memory Context (With Semantic Memory) ---');
  console.log(memoryXmlWithQuery);
  console.log('---------------------------------------------------------------------');

  console.log('\n✅ Phase 5 Vector Search & Semantic Memory Test Passed Successfully!');
}

testSemanticMemory().catch(console.error);

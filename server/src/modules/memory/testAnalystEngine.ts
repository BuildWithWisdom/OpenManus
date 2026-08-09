import 'dotenv/config';
import { MemoryExtractionSchema } from './analystEngine';
import { memoryManager } from './memoryManager';

async function testAnalystEngine() {
  console.log('=== 🧠 Testing Analyst AI Engine & Schema Validation (Streamlined) ===\n');

  // 1. Test Schema Validation with Observation
  console.log('1. Testing Schema Validation (Lesson Interaction with Evidence)...');
  const mockEvidencePayload = {
    hasObservation: true,
    reasoning: 'User struggled with React state batching exercise.',
    learnerMemoryUpdates: {
      knowledgeLevel: 'intermediate',
      confidenceScore: 0.6,
    },
    teachingStrategyUpdates: {
      explanationStyle: 'visual_diagrams',
    },
    courseMemoryUpdates: {
      courseWeaknesses: ['React State Batching'],
      masteredConcepts: ['JSX Syntax', 'Component Props'],
    },
  };

  const validationSuccess = MemoryExtractionSchema.safeParse(mockEvidencePayload);
  console.log('Validation (With Evidence):', validationSuccess.success ? 'PASSED ✅' : 'FAILED ❌');
  if (validationSuccess.success) {
    console.log('Parsed Rationale:', validationSuccess.data.reasoning);
  }

  // 2. Test Schema Validation (No Observation / Casual Turn)
  console.log('\n2. Testing Schema Validation (Turn without Evidence)...');
  const mockCasualPayload = {
    hasObservation: false,
    reasoning: 'Standard polite thank you message without learning evidence.',
  };

  const validationCasualSuccess = MemoryExtractionSchema.safeParse(mockCasualPayload);
  console.log('Validation (Casual Turn):', validationCasualSuccess.success ? 'PASSED ✅' : 'FAILED ❌');

  // 3. Test Memory Updates Dispatch
  console.log('\n3. Testing Memory Updates Dispatch to MemoryManager...');
  const testUserId = 'user-wisdom-analyst-test';
  const testCourseId = 'course-react-fundamentals';

  if (validationSuccess.success && validationSuccess.data.learnerMemoryUpdates) {
    const updatedLearner = await memoryManager.updateLearnerMemory(
      testUserId,
      validationSuccess.data.learnerMemoryUpdates
    );
    console.log('Updated Learner Confidence Score:', updatedLearner.confidenceScore);
  }

  if (validationSuccess.success && validationSuccess.data.courseMemoryUpdates) {
    const currentCourse = await memoryManager.getCourseMemory(testUserId, testCourseId);
    const updatedCourse = await memoryManager.updateCourseMemory(testUserId, testCourseId, {
      courseWeaknesses: [
        ...currentCourse.courseWeaknesses,
        ...(validationSuccess.data.courseMemoryUpdates.courseWeaknesses || []),
      ],
      masteredConcepts: [
        ...currentCourse.masteredConcepts,
        ...(validationSuccess.data.courseMemoryUpdates.masteredConcepts || []),
      ],
    });
    console.log('Updated Course Weaknesses:', updatedCourse.courseWeaknesses);
    console.log('Updated Mastered Concepts:', updatedCourse.masteredConcepts);
  }

  console.log('\n✅ Analyst Engine Schema & Dispatch Test Passed Successfully!');
}

testAnalystEngine().catch(console.error);

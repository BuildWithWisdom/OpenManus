import { prisma } from '../src/db/client';

async function clearDatabase() {
  console.log('[Script] Starting database wipe...');

  try {
    // Delete dependent tables first to respect foreign key constraints
    await prisma.semanticMemory.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.moduleLesson.deleteMany();
    await prisma.courseModule.deleteMany();
    await prisma.courseMemory.deleteMany();
    await prisma.course.deleteMany();
    await prisma.learnerMemory.deleteMany();
    await prisma.teachingStrategyMemory.deleteMany();
    await prisma.sessionState.deleteMany();
    await prisma.knowledgeMemory.deleteMany();
    await prisma.user.deleteMany();

    console.log('[Script] Successfully wiped all tables in database.');
    process.exit(0);
  } catch (err) {
    console.error('[Script Error] Failed to clear database:', err);
    process.exit(1);
  }
}

clearDatabase();

import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { prisma } from '../../db/client';

const JWT_SECRET = process.env.JWT_SECRET || 'openmanus_jwt_secret_key_2026_super_secure';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  private async generateToken(user: { id: string; email: string; name: string }) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days expiration
    };
    return sign(payload, JWT_SECRET, 'HS256');
  }

  async register(input: RegisterInput) {
    const emailNormalized = input.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: emailNormalized,
        passwordHash,
        learnerMemory: {
          create: {
            knowledgeLevel: 'beginner',
            learningPace: 'moderate',
            confidenceScore: 0.5,
          },
        },
        teachingStrategy: {
          create: {
            learningApproach: 'balanced',
            explanationStyle: 'analogy_driven',
            assessmentFrequency: 'periodic_milestones',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await this.generateToken(user);

    return { user, token };
  }

  async login(input: LoginInput) {
    const emailNormalized = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = await this.generateToken(userProfile);

    return { user: userProfile, token };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found.');
    }

    const dataToUpdate: { name?: string; email?: string } = {};

    if (input.name && input.name.trim()) {
      dataToUpdate.name = input.name.trim();
    }

    if (input.email && input.email.trim()) {
      const emailNormalized = input.email.toLowerCase().trim();
      if (emailNormalized !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });
        if (existing) {
          throw new Error('This email is already in use by another account.');
        }
        dataToUpdate.email = emailNormalized;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await this.generateToken(updatedUser);

    return { user: updatedUser, token };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password does not match.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true, message: 'Password updated successfully.' };
  }
}

export const authService = new AuthService();

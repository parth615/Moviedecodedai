import { prisma } from './prisma';

interface SessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Safely resolves the User record in the database.
 * If the user's ID or email exists in the DB, it returns that record.
 * If the user record is missing (e.g. after a DB reset with persistent JWT cookie),
 * it safely creates/upserts the user so updates will never fail.
 */
export async function getOrCreateUser(sessionUser?: SessionUser | null) {
  if (!sessionUser) return null;

  const userId = sessionUser.id;
  const userEmail = sessionUser.email;

  // 1. Try finding by ID
  if (userId) {
    try {
      const userById = await prisma.user.findUnique({ where: { id: userId } });
      if (userById) return userById;
    } catch (_) {}
  }

  // 2. Try finding by Email
  if (userEmail) {
    try {
      const userByEmail = await prisma.user.findUnique({ where: { email: userEmail } });
      if (userByEmail) return userByEmail;
    } catch (_) {}
  }

  // 3. User does not exist in the database -> Safely create it!
  try {
    const newUser = await prisma.user.create({
      data: {
        id: userId || undefined,
        email: userEmail || undefined,
        name: sessionUser.name || null,
        image: sessionUser.image || null,
        credits: 0,
      },
    });
    return newUser;
  } catch (error) {
    // If creation by ID failed because of conflict, try finding by email one more time
    if (userEmail) {
      const fallbackUser = await prisma.user.findUnique({ where: { email: userEmail } });
      if (fallbackUser) return fallbackUser;
    }
    throw error;
  }
}

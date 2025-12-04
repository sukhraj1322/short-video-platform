import bcrypt from 'bcryptjs';
import { User } from '@/types';
import { createUser, getUserByUsername, saveSession, getSession, clearSession, addLog } from './idb';

export async function signup(username: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user: User = {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash,
      createdAt: Date.now(),
    };

    await createUser(user);
    await addLog({ type: 'signup', message: `User ${username} signed up` });

    return { success: true, message: 'Account created successfully', user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: 'Failed to create account' };
  }
}

export async function login(username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid username or password' };
    }

    await saveSession(user.id);
    await addLog({ type: 'login', message: `User ${username} logged in`, metadata: { userId: user.id } });

    return { success: true, message: 'Login successful', user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    await addLog({ type: 'logout', message: 'User logged out', metadata: { userId: session.userId } });
  }
  await clearSession();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getSession();
    if (!session) return null;

    const { getUserById } = await import('./idb');
    const user = await getUserById(session.userId);
    return user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

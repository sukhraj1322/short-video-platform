import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User, Video, Log, Settings } from '@/types';

interface ShortlyXDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string; 'by-email': string };
  };
  videos: {
    key: string;
    value: Video;
    indexes: { 'by-user': string; 'by-date': number };
  };
  videoBlobs: {
    key: string; // publicId
    value: Blob;
  };
  logs: {
    key: string;
    value: Log;
    indexes: { 'by-type': string; 'by-date': number };
  };
  settings: {
    key: string;
    value: Settings;
  };
  session: {
    key: string;
    value: { userId: string; timestamp: number };
  };
}

let dbInstance: IDBPDatabase<ShortlyXDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ShortlyXDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ShortlyXDB>('shortlyx-db', 1, {
    upgrade(db) {
      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-username', 'username', { unique: true });
        userStore.createIndex('by-email', 'email', { unique: true });
      }

      // Videos store
      if (!db.objectStoreNames.contains('videos')) {
        const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
        videoStore.createIndex('by-user', 'userId');
        videoStore.createIndex('by-date', 'uploadedAt');
      }

      // Video blobs store (for demo/local mode persistence)
      if (!db.objectStoreNames.contains('videoBlobs')) {
        db.createObjectStore('videoBlobs');
      }

      // Logs store
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id' });
        logStore.createIndex('by-type', 'type');
        logStore.createIndex('by-date', 'timestamp');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'theme' });
      }

      // Session store
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'userId' });
      }
    },
  });

  return dbInstance;
}

// User operations
export async function createUser(user: User): Promise<void> {
  const db = await getDB();
  await db.add('users', user);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.getFromIndex('users', 'by-username', username);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDB();
  return await db.get('users', id);
}

// Video operations
export async function saveVideo(video: Video): Promise<void> {
  const db = await getDB();
  await db.add('videos', video);
}

// Save raw Blob for locally-stored videos (demo mode)
export async function saveVideoBlob(publicId: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('videoBlobs', blob, publicId);
}

export async function getVideoBlob(publicId: string): Promise<Blob | undefined> {
  const db = await getDB();
  return await db.get('videoBlobs', publicId);
}

export async function deleteVideoBlob(publicId: string): Promise<void> {
  const db = await getDB();
  await db.delete('videoBlobs', publicId);
}

export async function getAllVideos(): Promise<Video[]> {
  const db = await getDB();
  return await db.getAllFromIndex('videos', 'by-date');
}

export async function getVideosByUser(userId: string): Promise<Video[]> {
  const db = await getDB();
  return await db.getAllFromIndex('videos', 'by-user', userId);
}

export async function deleteVideo(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('videos', id);
}

export async function updateVideo(video: Video): Promise<void> {
  const db = await getDB();
  await db.put('videos', video);
}

// Log operations
export async function addLog(log: Omit<Log, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB();
  const fullLog: Log = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await db.add('logs', fullLog);
}

export async function getAllLogs(): Promise<Log[]> {
  const db = await getDB();
  return await db.getAllFromIndex('logs', 'by-date');
}

// Session operations
export async function saveSession(userId: string): Promise<void> {
  const db = await getDB();
  await db.put('session', { userId, timestamp: Date.now() });
}

export async function getSession(): Promise<{ userId: string; timestamp: number } | undefined> {
  const db = await getDB();
  const sessions = await db.getAll('session');
  return sessions[0];
}

export async function clearSession(): Promise<void> {
  const db = await getDB();
  await db.clear('session');
}

// Settings operations
export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  const settings = await db.getAll('settings');
  return settings[0];
}

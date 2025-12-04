export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: number;
  lastLogin?: number;
}

export interface Video {
  id: string;
  userId: string;
  username: string;
  cloudinaryUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  duration: number;
  resolution: string;
  likes: number;
  comments: Comment[];
  views: number;
  uploadedAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Log {
  id: string;
  type: 'login' | 'logout' | 'signup' | 'upload' | 'delete' | 'like' | 'comment' | 'search' | 'view';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Settings {
  theme: 'dark' | 'light';
  autoplay: boolean;
  notifications: boolean;
}

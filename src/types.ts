export interface Sound {
  id: string;
  title: string;
  duration: number;
  tags: string[];
  genre: string;
  uploadedAt: Date;
  plays: number;
  downloads: number;
  likes: number;
  url: string;
  coverUrl?: string;
  description?: string;
  lyrics?: string;
  isLoud?: boolean;
  isMine?: boolean;
}

export interface SoundRequest {
  id: string;
  title: string;
  description: string;
  requestedAt: Date;
}

export interface Comment {
  id: string;
  soundId: string;
  parentId?: string;
  text: string;
  likes: number;
  createdAt: Date;
  ownerId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  soundIds: string[];
  createdAt: Date;
}

export type Page =
  | 'home'
  | 'music'
  | 'favorites'
  | 'rights'
  | 'request_sound'
  | 'telegram'
  | 'search'
  | 'settings';

export interface PlayerState {
  currentSound: Sound | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  queue: Sound[];
  shuffle: boolean;
  repeat: boolean;
  currentTime: number;
  currentIndex: number;
}

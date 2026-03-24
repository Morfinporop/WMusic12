import { Sound } from './types';

export interface ApiComment {
  id: string;
  soundId: string;
  parentId?: string;
  text: string;
  likes: number;
  createdAt: string;
  ownerId?: string;
}

export interface UploadSoundInput {
  title: string;
  tags: string[];
  genre: string;
  description?: string;
  lyrics?: string;
  duration?: number;
  file?: File | null;
  coverFile?: File | null;
  urlInput?: string;
}

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

function normalizeSound(sound: Sound): Sound {
  return {
    ...sound,
    uploadedAt: new Date(sound.uploadedAt),
  };
}

export async function fetchSounds(): Promise<Sound[]> {
  const res = await fetch(`${API_BASE}/api/sounds`);
  if (!res.ok) throw new Error('Failed to load sounds');
  const data = (await res.json()) as Sound[];
  return data.map(normalizeSound);
}

export async function uploadSound(input: UploadSoundInput): Promise<Sound> {
  const form = new FormData();
  form.append('title', input.title);
  form.append('genre', input.genre);
  form.append('tags', JSON.stringify(input.tags));
  form.append('description', input.description || '');
  form.append('lyrics', input.lyrics || '');
  form.append('duration', String(input.duration || 0));
  if (input.urlInput) form.append('urlInput', input.urlInput);
  if (input.file) form.append('audio', input.file);
  if (input.coverFile) form.append('cover', input.coverFile);

  const res = await fetch(`${API_BASE}/api/sounds`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Failed to upload sound');
  const data = (await res.json()) as Sound;
  return normalizeSound(data);
}

export async function removeSound(soundId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sounds/${soundId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete sound');
}

export async function toggleLike(soundId: string, clientId: string): Promise<{ likes: number; liked: boolean }> {
  const res = await fetch(`${API_BASE}/api/sounds/${soundId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json();
}

export async function registerDownload(soundId: string, clientId: string): Promise<{ downloads: number }> {
  const res = await fetch(`${API_BASE}/api/sounds/${soundId}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error('Failed to register download');
  return res.json();
}

export async function registerPlayComplete(soundId: string, clientId: string): Promise<{ plays: number }> {
  const res = await fetch(`${API_BASE}/api/sounds/${soundId}/play-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error('Failed to register play');
  return res.json();
}

export async function fetchComments(soundId: string): Promise<ApiComment[]> {
  const res = await fetch(`${API_BASE}/api/comments?soundId=${encodeURIComponent(soundId)}`);
  if (!res.ok) throw new Error('Failed to load comments');
  return res.json();
}

export async function createComment(input: {
  soundId: string;
  text: string;
  parentId?: string;
  clientId: string;
}): Promise<ApiComment> {
  const res = await fetch(`${API_BASE}/api/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create comment');
  return res.json();
}

export async function toggleCommentLike(commentId: string, clientId: string): Promise<{ likes: number; liked: boolean }> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error('Failed to toggle comment like');
  return res.json();
}

export async function deleteComment(commentId: string, clientId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}?clientId=${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete comment');
}
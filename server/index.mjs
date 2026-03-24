import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const persistentBase = (process.env.WMUSIC_STORAGE_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '').trim();
const storageBase = persistentBase || (fs.existsSync('/data') ? '/data' : rootDir);
const dataDir = path.join(storageBase, 'data');
const uploadsDir = path.join(storageBase, 'uploads');
const audioDir = path.join(uploadsDir, 'audio');
const coverDir = path.join(uploadsDir, 'covers');
const dbPath = path.join(dataDir, 'db.json');
const distDir = path.join(rootDir, 'dist');

for (const dir of [dataDir, uploadsDir, audioDir, coverDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(
    dbPath,
    JSON.stringify({ sounds: [], comments: [], events: { likes: {}, downloads: {}, plays: {}, commentLikes: {} } }, null, 2),
    'utf-8',
  );
}

const app = express();
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const isCover = file.fieldname === 'cover';
      cb(null, isCover ? coverDir : audioDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || (file.fieldname === 'cover' ? '.jpg' : '.mp3');
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir));

function readDb() {
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.sounds)) data.sounds = [];
    if (!Array.isArray(data.comments)) data.comments = [];
    if (!data.events || typeof data.events !== 'object') data.events = {};
    if (!data.events.likes || typeof data.events.likes !== 'object') data.events.likes = {};
    if (!data.events.downloads || typeof data.events.downloads !== 'object') data.events.downloads = {};
    if (!data.events.plays || typeof data.events.plays !== 'object') data.events.plays = {};
    if (!data.events.commentLikes || typeof data.events.commentLikes !== 'object') data.events.commentLikes = {};
    return data;
  } catch {
    return { sounds: [], comments: [], events: { likes: {}, downloads: {}, plays: {}, commentLikes: {} } };
  }
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function numberToWordsRu(value) {
  const ones = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  if (!Number.isFinite(value)) return String(value);
  const n = Math.abs(Math.trunc(value));
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ''}`.trim();
  }
  return String(value);
}

function normalizeLyrics(text) {
  if (!text) return '';
  const replacedDigits = text.replace(/\b\d{1,2}\b/g, (m) => numberToWordsRu(Number(m)));
  const compact = replacedDigits.replace(/\s+/g, ' ').trim();
  if (!compact) return '';

  const sentenceChunks = compact
    .split(/(?<=[.!?])\s+/g)
    .map((line) => line.trim())
    .filter(Boolean);

  const chunks = sentenceChunks.flatMap((sentence) => {
    if (sentence.length <= 70) return [sentence];
    const words = sentence.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > 70) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines;
  });

  if (!chunks.length) return compact;
  return chunks.slice(0, 120).join('\n');
}

async function transcribeAudioFromOpenAI(audioAbsolutePath, originalFileName) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return '';
  if (!fs.existsSync(audioAbsolutePath)) return '';

  const stats = fs.statSync(audioAbsolutePath);
  // Skip oversized files for transcription API safety.
  if (!stats.isFile() || stats.size <= 0 || stats.size > 24 * 1024 * 1024) {
    return '';
  }

  try {
    const model = String(process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1').trim();
    const buffer = fs.readFileSync(audioAbsolutePath);
    const mimeType = 'audio/mpeg';
    const audioBlob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append('model', model);
    form.append('file', audioBlob, originalFileName || path.basename(audioAbsolutePath));
    form.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      return '';
    }

    const payload = await response.json();
    return normalizeLyrics(String(payload?.text || '').trim());
  } catch {
    return '';
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now(), storageBase });
});

app.get('/api/sounds', (_req, res) => {
  const db = readDb();
  res.json(db.sounds);
});

app.post('/api/sounds', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const db = readDb();
  const files = req.files || {};
  const audioFile = files.audio?.[0];
  const coverFile = files.cover?.[0];
  const title = String(req.body.title || '').trim();
  const genre = String(req.body.genre || 'other').trim();
  const description = String(req.body.description || '').trim();
  const inputLyrics = String(req.body.lyrics || '').trim();
  const isLoud = String(req.body.isLoud || '0') === '1';
  const duration = Number(req.body.duration || 0) || 0;
  const urlInput = String(req.body.urlInput || '').trim();

  let parsedTags = [];
  try {
    const rawTags = JSON.parse(req.body.tags || '[]');
    if (Array.isArray(rawTags)) parsedTags = rawTags.map((x) => String(x).trim()).filter(Boolean).slice(0, 10);
  } catch {
    parsedTags = [];
  }

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  if (!audioFile && !urlInput) {
    res.status(400).json({ error: 'Audio file or URL is required' });
    return;
  }

  let lyrics = inputLyrics;
  if (!lyrics && audioFile) {
    const absoluteAudioPath = path.join(audioDir, audioFile.filename);
    lyrics = await transcribeAudioFromOpenAI(absoluteAudioPath, audioFile.originalname);
  }

  const sound = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    duration,
    tags: parsedTags.length ? parsedTags : [genre],
    genre,
    uploadedAt: new Date().toISOString(),
    plays: 0,
    downloads: 0,
    likes: 0,
    url: audioFile ? `/uploads/audio/${audioFile.filename}` : urlInput,
    coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : undefined,
    description,
    lyrics,
    isLoud,
    isMine: true,
  };

  db.sounds.unshift(sound);
  writeDb(db);
  res.status(201).json(sound);
});

app.delete('/api/sounds/:id', (req, res) => {
  const db = readDb();
  const id = req.params.id;
  const found = db.sounds.find((s) => s.id === id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  db.sounds = db.sounds.filter((s) => s.id !== id);
  writeDb(db);

  if (typeof found.url === 'string' && found.url.startsWith('/uploads/')) {
    const audioPath = path.join(rootDir, found.url.replace(/^\//, ''));
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
  if (typeof found.coverUrl === 'string' && found.coverUrl.startsWith('/uploads/')) {
    const coverPath = path.join(rootDir, found.coverUrl.replace(/^\//, ''));
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }

  res.status(204).end();
});

function getClientId(req) {
  return String(req.body?.clientId || req.query?.clientId || '').trim();
}

function ensureEventSet(db, bucket, entityId) {
  if (!db.events[bucket][entityId]) db.events[bucket][entityId] = [];
  return db.events[bucket][entityId];
}

app.post('/api/sounds/:id/like', (req, res) => {
  const db = readDb();
  const sound = db.sounds.find((s) => s.id === req.params.id);
  const clientId = getClientId(req);
  if (!sound) return res.status(404).json({ error: 'Not found' });
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  const users = ensureEventSet(db, 'likes', sound.id);
  const index = users.indexOf(clientId);
  const liked = index === -1;
  if (liked) users.push(clientId);
  else users.splice(index, 1);

  sound.likes = users.length;
  writeDb(db);
  return res.json({ likes: sound.likes, liked });
});

app.post('/api/sounds/:id/download', (req, res) => {
  const db = readDb();
  const sound = db.sounds.find((s) => s.id === req.params.id);
  const clientId = getClientId(req);
  if (!sound) return res.status(404).json({ error: 'Not found' });
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  const users = ensureEventSet(db, 'downloads', sound.id);
  if (!users.includes(clientId)) users.push(clientId);
  sound.downloads = users.length;
  writeDb(db);
  return res.json({ downloads: sound.downloads });
});

app.post('/api/sounds/:id/play-complete', (req, res) => {
  const db = readDb();
  const sound = db.sounds.find((s) => s.id === req.params.id);
  const clientId = getClientId(req);
  if (!sound) return res.status(404).json({ error: 'Not found' });
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  const users = ensureEventSet(db, 'plays', sound.id);
  if (!users.includes(clientId)) users.push(clientId);
  sound.plays = users.length;
  writeDb(db);
  return res.json({ plays: sound.plays });
});

app.get('/api/comments', (req, res) => {
  const db = readDb();
  const soundId = String(req.query.soundId || '').trim();
  const comments = soundId ? db.comments.filter((c) => c.soundId === soundId) : db.comments;
  return res.json(comments);
});

app.post('/api/comments', (req, res) => {
  const db = readDb();
  const soundId = String(req.body?.soundId || '').trim();
  const text = String(req.body?.text || '').trim();
  const parentId = String(req.body?.parentId || '').trim() || undefined;
  const clientId = getClientId(req);
  if (!soundId || !text) return res.status(400).json({ error: 'soundId and text required' });
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    soundId,
    parentId,
    text,
    likes: 0,
    createdAt: new Date().toISOString(),
    ownerId: clientId,
  };
  db.comments.push(comment);
  writeDb(db);
  return res.status(201).json(comment);
});

app.post('/api/comments/:id/like', (req, res) => {
  const db = readDb();
  const comment = db.comments.find((c) => c.id === req.params.id);
  const clientId = getClientId(req);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (!clientId) return res.status(400).json({ error: 'clientId required' });

  const users = ensureEventSet(db, 'commentLikes', comment.id);
  const index = users.indexOf(clientId);
  const liked = index === -1;
  if (liked) users.push(clientId);
  else users.splice(index, 1);

  comment.likes = users.length;
  writeDb(db);
  return res.json({ likes: comment.likes, liked });
});

app.delete('/api/comments/:id', (req, res) => {
  const db = readDb();
  const clientId = getClientId(req);
  const commentId = req.params.id;
  const comment = db.comments.find((c) => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  if (!clientId || comment.ownerId !== clientId) return res.status(403).json({ error: 'Forbidden' });

  db.comments = db.comments.filter((c) => c.id !== commentId && c.parentId !== commentId);
  delete db.events.commentLikes[commentId];
  writeDb(db);
  return res.status(204).end();
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // Express 5 + path-to-regexp does not support bare "*" route patterns.
  // Use a final middleware fallback for SPA routing instead.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`WMusic server is running on :${port}`);
});
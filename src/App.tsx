import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Comment, Page, PlayerState, Playlist, Sound } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SoundGrid from './components/SoundGrid';
import UploadModal from './components/UploadModal';
import BottomPlayer from './components/BottomPlayer';
import NowPlayingPanel from './components/NowPlayingPanel';
import ChartsPage from './components/ChartsPage';
import SearchPage from './components/SearchPage';
import LibraryPage from './components/LibraryPage';
import SettingsModal from './components/SettingsModal';
import MobileTabBar from './components/MobileTabBar';
import { localizeTitle } from './utils/text';
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchSounds,
  registerDownload,
  registerPlayComplete,
  toggleCommentLike,
  toggleLike as toggleSoundLikeApi,
  UploadSoundInput,
  uploadSound,
} from './api';

function similarity(a: string, b: string): number {
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();
  if (!bb.trim()) return 0;
  if (aa.includes(bb) || bb.includes(aa)) return 1;
  const parts = bb.split(' ').filter(Boolean);
  return parts.reduce((acc, p) => acc + (aa.includes(p) ? 0.25 : 0), 0);
}

function loadSounds(): Sound[] {
  try {
    const raw = localStorage.getItem('wmusic_sounds');
    if (!raw) return [];
    return JSON.parse(raw).map((s: Sound) => ({ ...s, uploadedAt: new Date(s.uploadedAt) }));
  } catch {
    return [];
  }
}

function getClientId(): string {
  const existing = localStorage.getItem('wmusic_client_id');
  if (existing) return existing;
  const created = `c-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem('wmusic_client_id', created);
  return created;
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors to avoid white screen on production.
  }
}

function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem('wmusic_playlists');
    if (!raw) return [];
    return JSON.parse(raw).map((p: Playlist) => ({ ...p, createdAt: new Date(p.createdAt) }));
  } catch {
    return [];
  }
}

function buildLyricsLines(sound: Sound | null, lang: 'ru' | 'en') {
  if (!sound) return [] as string[];
  const providedLyrics = (sound.lyrics || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (providedLyrics.length > 0) {
    return providedLyrics;
  }

  const baseRu = [
    `Трек: ${sound.title}`,
    'Автоматический текст песни пока недоступен для этой композиции.',
    'Проверьте позже: после обработки нейросетью здесь появятся строки песни.',
    'Временный анализ: ритм ровный, бас стабильный, темп удерживается.',
  ];
  const baseEn = [
    `Track: ${localizeTitle(sound.title, 'en')}`,
    'Automatic lyrics are not available for this track yet.',
    'Check back later: the AI pipeline will populate the song lines.',
    'Fallback analysis: steady rhythm, stable bass, consistent tempo.',
  ];

  return lang === 'ru' ? baseRu : baseEn;
}

interface BrowserCheckResult {
  cookiesEnabled: boolean;
  botScore: number;
  token: string;
}

function runBrowserCheck(): BrowserCheckResult {
  const cookiesEnabled = navigator.cookieEnabled;
  const ua = navigator.userAgent.toLowerCase();
  const botTokens = ['bot', 'spider', 'crawler', 'headless', 'selenium'];
  const hasBotMark = botTokens.some((token) => ua.includes(token));
  const randomPart = Math.floor(Math.random() * 900000 + 100000).toString();
  const tsPart = Date.now().toString().slice(-6);
  return {
    cookiesEnabled,
    botScore: hasBotMark ? 92 : Math.floor(Math.random() * 30) + 3,
    token: `${randomPart}-${tsPart}`,
  };
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [clientId] = useState<string>(() => getClientId());
  const [sounds, setSounds] = useState<Sound[]>(loadSounds);
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [commentsBySound, setCommentsBySound] = useState<Record<string, Comment[]>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const lang: 'ru' | 'en' = 'ru';
  const [audioQuality, setAudioQuality] = useState<'auto' | 'high' | 'balanced' | 'data'>(() => {
    const stored = localStorage.getItem('wmusic_audio_quality');
    if (stored === 'auto' || stored === 'high' || stored === 'balanced' || stored === 'data') return stored;
    return 'high';
  });
  const [crossfadeEnabled, setCrossfadeEnabled] = useState<boolean>(() => localStorage.getItem('wmusic_crossfade') === '1');
  const [audioBoost, setAudioBoost] = useState<number>(() => {
    const raw = Number(localStorage.getItem('wmusic_audio_boost') || 1);
    return Number.isFinite(raw) ? Math.min(10, Math.max(1, raw)) : 1;
  });
  const [showCovers, setShowCovers] = useState<boolean>(() => localStorage.getItem('wmusic_show_covers') !== '0');
  const [coverBlur, setCoverBlur] = useState<number>(() => Number(localStorage.getItem('wmusic_cover_blur') || 7));
  const [preferTranslated, setPreferTranslated] = useState<boolean>(() => localStorage.getItem('wmusic_prefer_translated') === '1');
  const [preferPopular, setPreferPopular] = useState<boolean>(() => localStorage.getItem('wmusic_prefer_popular') === '1');
  const [showVolumeWarning, setShowVolumeWarning] = useState<boolean>(() => localStorage.getItem('wmusic_volume_warning') !== '0');
  const [autoplayNext, setAutoplayNext] = useState<boolean>(() => localStorage.getItem('wmusic_autoplay_next') !== '0');
  const [showBrowserCheck, setShowBrowserCheck] = useState(true);
  const [browserCheckResult, setBrowserCheckResult] = useState<BrowserCheckResult | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('wmusic_liked') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [recentSoundIds, setRecentSoundIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('wmusic_recent_sounds') || '[]');
    } catch {
      return [];
    }
  });
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSound: null,
    isPlaying: false,
    progress: 0,
    volume: 0.85,
    queue: [],
    shuffle: false,
    repeat: false,
    currentTime: 0,
    currentIndex: -1,
  });
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [completedOnceIds, setCompletedOnceIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('wmusic_completed_once') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [downloadedOnceIds, setDownloadedOnceIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('wmusic_downloaded_once') || '[]'));
    } catch {
      return new Set();
    }
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedSoundIdRef = useRef<string | null>(null);
  const toastRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lastTimeUpdateRef = useRef(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 960);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const lyricsLines = useMemo(() => buildLyricsLines(playerState.currentSound, lang), [playerState.currentSound, lang]);

  useEffect(() => {
    let mounted = true;
    fetchSounds()
      .then((serverSounds) => {
        if (!mounted) return;
        if (serverSounds.length > 0) {
          setSounds(serverSounds);
        }
      })
      .catch(() => {
        // Keep local fallback if server is temporarily unavailable.
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    // Keep initial render light on mobile. Comments are loaded lazily per track.
  }, [sounds.length]);

  const showToast = (text: string) => {
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    safeSet('wmusic_sounds', sounds);
  }, [sounds]);

  useEffect(() => {
    safeSet('wmusic_liked', [...likedIds]);
  }, [likedIds]);

  useEffect(() => {
    safeSet('wmusic_recent_sounds', recentSoundIds);
  }, [recentSoundIds]);

  useEffect(() => {
    safeSet('wmusic_completed_once', [...completedOnceIds]);
  }, [completedOnceIds]);

  useEffect(() => {
    safeSet('wmusic_downloaded_once', [...downloadedOnceIds]);
  }, [downloadedOnceIds]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setBannerIndex(prev => (prev + 1) % 2);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem('wmusic_audio_quality', audioQuality);
  }, [audioQuality]);

  useEffect(() => {
    localStorage.setItem('wmusic_crossfade', crossfadeEnabled ? '1' : '0');
  }, [crossfadeEnabled]);

  useEffect(() => {
    localStorage.setItem('wmusic_audio_boost', String(audioBoost));
  }, [audioBoost]);

  useEffect(() => {
    localStorage.setItem('wmusic_show_covers', showCovers ? '1' : '0');
  }, [showCovers]);

  useEffect(() => {
    localStorage.setItem('wmusic_cover_blur', String(Math.max(0, Math.min(18, coverBlur))));
  }, [coverBlur]);

  useEffect(() => {
    localStorage.setItem('wmusic_prefer_translated', preferTranslated ? '1' : '0');
  }, [preferTranslated]);

  useEffect(() => {
    localStorage.setItem('wmusic_prefer_popular', preferPopular ? '1' : '0');
  }, [preferPopular]);

  useEffect(() => {
    localStorage.setItem('wmusic_volume_warning', showVolumeWarning ? '1' : '0');
  }, [showVolumeWarning]);

  useEffect(() => {
    localStorage.setItem('wmusic_autoplay_next', autoplayNext ? '1' : '0');
  }, [autoplayNext]);

  useEffect(() => {
    if (!showVolumeWarning) return;
    if (playerState.volume * audioBoost >= 1.6) {
      showToast('Высокая громкость может повредить слух.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVolumeWarning, playerState.volume, audioBoost]);

  useEffect(() => {
    const result = runBrowserCheck();
    setBrowserCheckResult(result);
    const timer = window.setTimeout(() => setShowBrowserCheck(false), 2100);
    return () => window.clearTimeout(timer);
  }, []);

  const setOutputGain = useCallback((value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(10, value));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
      audio.volume = 1;
      return;
    }
    audio.volume = Math.max(0, Math.min(1, clamped));
  }, []);

  const resolveQualityMode = useCallback((): 'high' | 'balanced' | 'data' => {
    if (audioQuality !== 'auto') return audioQuality;
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number };
    }).connection;
    const effectiveType = connection?.effectiveType || '';
    const downlink = connection?.downlink || 0;
    if (effectiveType.includes('2g') || downlink < 1) return 'data';
    if (effectiveType.includes('3g') || downlink < 4) return 'balanced';
    return 'high';
  }, [audioQuality]);

  const applyQualityProfile = useCallback(() => {
    const mode = resolveQualityMode();
    const filter = filterNodeRef.current;
    if (!filter) return;

    filter.type = 'lowpass';
    filter.Q.value = 0.0001;
    if (mode === 'high') {
      filter.frequency.value = 22050;
      return;
    }
    if (mode === 'balanced') {
      filter.frequency.value = 14500;
      return;
    }
    filter.frequency.value = 9000;
  }, [resolveQualityMode]);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (gainNodeRef.current) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => undefined);
      }
      return;
    }
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      filterNodeRef.current = filter;
      gainNodeRef.current = gain;
      applyQualityProfile();
      setOutputGain(playerState.volume * audioBoost);
    } catch {
      // Browser can block creating graph multiple times for same element.
    }
  }, [applyQualityProfile, audioBoost, playerState.volume, setOutputGain]);

  const syncPlaylists = useCallback(() => {
    setPlaylists(loadPlaylists());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'wmusic_playlists') syncPlaylists();
    };
    const onFocus = () => syncPlaylists();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [syncPlaylists]);

  useEffect(() => {
    const audio = audioRef.current;
    const sound = playerState.currentSound;
    if (!audio || !sound?.url) return;
    if (loadedSoundIdRef.current !== sound.id) {
      audio.src = sound.url;
      audio.currentTime = 0;
      loadedSoundIdRef.current = sound.id;
    }
    if (playerState.isPlaying) {
      audio.play().catch(() => undefined);
    }
  }, [playerState.currentSound?.id, playerState.currentSound?.url, playerState.isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playerState.isPlaying) audio.play().catch(() => undefined);
    else audio.pause();
  }, [playerState.isPlaying]);

  useEffect(() => {
    setOutputGain(playerState.volume * audioBoost);
  }, [audioBoost, playerState.volume, setOutputGain]);

  useEffect(() => {
    applyQualityProfile();
  }, [applyQualityProfile, audioQuality]);

  const rememberRecent = (soundId: string) => {
    setRecentSoundIds(prev => [soundId, ...prev.filter(x => x !== soundId)].slice(0, 3));
  };

  const playSound = useCallback((sound: Sound, all: Sound[] = sounds) => {
    ensureAudioGraph();
    setPlayerState(prev => {
      if (prev.currentSound?.id === sound.id) {
        return { ...prev, isPlaying: !prev.isPlaying };
      }
      const source = all.length ? all : sounds;
      const idx = Math.max(0, source.findIndex(s => s.id === sound.id));
      return {
        ...prev,
        currentSound: sound,
        isPlaying: true,
        queue: source,
        currentIndex: idx,
        progress: 0,
        currentTime: 0,
      };
    });
    rememberRecent(sound.id);
    if (sound.isLoud && showVolumeWarning) {
      showToast('Осторожно: трек отмечен как громкий. Проверьте уровень громкости.');
    }
    setNowPlayingOpen(true);
  }, [ensureAudioGraph, showVolumeWarning, sounds]);

  const playNext = useCallback(() => {
    ensureAudioGraph();
    const audio = audioRef.current;
    const doSwitch = () => {
      setPlayerState(prev => {
        if (!prev.queue.length) return prev;
        const currentQueueIndex = prev.currentIndex >= 0
          ? prev.currentIndex
          : prev.queue.findIndex(s => s.id === prev.currentSound?.id);
        if (prev.shuffle) {
          const random = Math.floor(Math.random() * prev.queue.length);
          rememberRecent(prev.queue[random].id);
          return {
            ...prev,
            currentSound: prev.queue[random],
            currentIndex: random,
            isPlaying: true,
            progress: 0,
            currentTime: 0,
          };
        }
        const next = currentQueueIndex + 1;
        if (next >= prev.queue.length) {
          rememberRecent(prev.queue[0].id);
          return {
            ...prev,
            currentSound: prev.queue[0],
            currentIndex: 0,
            isPlaying: true,
            progress: 0,
            currentTime: 0,
          };
        }
        return {
          ...prev,
          currentSound: prev.queue[next],
          currentIndex: next,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        };
      });
    };

    if (!crossfadeEnabled || !audio || audio.paused) {
      doSwitch();
      setNowPlayingOpen(true);
      return;
    }

    const startGain = playerState.volume * audioBoost;
    let step = 0;
    const steps = 6;
    const out = window.setInterval(() => {
      step += 1;
      setOutputGain(startGain * (1 - step / steps));
      if (step >= steps) {
        window.clearInterval(out);
        doSwitch();
        window.setTimeout(() => {
          let inStep = 0;
          const inTimer = window.setInterval(() => {
            inStep += 1;
            setOutputGain(startGain * (inStep / steps));
            if (inStep >= steps) window.clearInterval(inTimer);
          }, 22);
        }, 40);
      }
    }, 22);
    setNowPlayingOpen(true);
  }, [audioBoost, crossfadeEnabled, ensureAudioGraph, playerState.volume, setOutputGain]);

  const playPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setPlayerState(prev => ({ ...prev, currentTime: 0, progress: 0 }));
      return;
    }
    setPlayerState(prev => {
      if (!prev.queue.length) return prev;
      const currentQueueIndex = prev.currentIndex >= 0
        ? prev.currentIndex
        : Math.max(0, prev.queue.findIndex(s => s.id === prev.currentSound?.id));
      const prevIndex = currentQueueIndex - 1 < 0 ? prev.queue.length - 1 : currentQueueIndex - 1;
      rememberRecent(prev.queue[prevIndex].id);
      return {
        ...prev,
        currentSound: prev.queue[prevIndex],
        currentIndex: prevIndex,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
      };
    });
    setNowPlayingOpen(true);
  }, []);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const now = performance.now();
    if (now - lastTimeUpdateRef.current < 180 && audio.currentTime < audio.duration - 0.25) {
      return;
    }
    lastTimeUpdateRef.current = now;
    setPlayerState(prev => ({
      ...prev,
      progress: audio.currentTime / audio.duration,
      currentTime: audio.currentTime,
    }));
  };

  const handleEnded = () => {
    const endedId = playerState.currentSound?.id;
    if (endedId) {
      registerPlayComplete(endedId, clientId)
        .then(({ plays }) => setSounds((current) => current.map((s) => (s.id === endedId ? { ...s, plays } : s))))
        .catch(() => undefined);
      setCompletedOnceIds((prev) => new Set([...prev, endedId]));
    }

    if (autoplayNext && playerState.queue.length > 1) {
      playNext();
      return;
    }

    setPlayerState((prev) => ({
      ...prev,
      isPlaying: false,
      progress: 1,
      currentTime: prev.currentSound?.duration || prev.currentTime,
    }));
  };

  const seek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    audio.currentTime = clamped * audio.duration;
    setPlayerState(prev => ({ ...prev, progress: clamped, currentTime: audio.currentTime }));
  };

  const toggleLikeLocal = (id: string, liked: boolean, likes: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(id);
      else next.delete(id);
      return next;
    });
    setSounds((prev) => prev.map((s) => (s.id === id ? { ...s, likes } : s)));
  };

  const toggleLikeSound = (id: string) => {
    toggleSoundLikeApi(id, clientId)
      .then(({ liked, likes }) => {
        toggleLikeLocal(id, liked, likes);
        showToast(liked ? 'Лайк +1' : 'Лайк убран -1');
      })
      .catch(() => showToast('Ошибка лайка'));
  };

  const downloadSound = (sound: Sound) => {
    if (!sound.url) return;
    const a = document.createElement('a');
    a.href = sound.url;
    a.download = `${sound.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    registerDownload(sound.id, clientId)
      .then(({ downloads }) => {
        setDownloadedOnceIds((prev) => new Set([...prev, sound.id]));
        setSounds((current) => current.map((s) => (s.id === sound.id ? { ...s, downloads } : s)));
      })
      .catch(() => undefined);
    showToast('Файл скачивается');
  };

  const handleAddComment = (soundId: string, text: string, parentId?: string) => {
    createComment({ soundId, text, parentId, clientId })
      .then((comment) => {
        setCommentsBySound((prev) => ({
          ...prev,
          [soundId]: [...(prev[soundId] || []), { ...comment, createdAt: new Date(comment.createdAt) }],
        }));
      })
      .catch(() => showToast('Не удалось добавить комментарий'));
  };

  const handleLikeComment = (commentId: string) => {
    toggleCommentLike(commentId, clientId)
      .then(({ likes }) => {
        setCommentsBySound((prev) => {
          const next: Record<string, Comment[]> = {};
          Object.keys(prev).forEach((soundId) => {
            next[soundId] = prev[soundId].map((comment) => (comment.id === commentId ? { ...comment, likes } : comment));
          });
          return next;
        });
      })
      .catch(() => undefined);
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId, clientId)
      .then(() => {
        setCommentsBySound((prev) => {
          const next: Record<string, Comment[]> = {};
          Object.keys(prev).forEach((soundId) => {
            next[soundId] = prev[soundId].filter((comment) => comment.id !== commentId && comment.parentId !== commentId);
          });
          return next;
        });
      })
      .catch(() => showToast('Нельзя удалить этот комментарий'));
  };

  const addSound = async (payload: UploadSoundInput) => {
    try {
      const created = await uploadSound(payload);
      setSounds(prev => [created, ...prev]);
      setShowUpload(false);
      setPage('home');
      showToast('Музыка загружена');
    } catch {
      showToast('Ошибка загрузки на сервер');
    }
  };

  const addToSoundpad = (sound: Sound) => {
    if (!sound.url) {
      showToast('Источник музыки недоступен для SoundPad');
      return;
    }

    const absoluteUrl = sound.url.startsWith('http')
      ? sound.url
      : `${window.location.origin}${sound.url.startsWith('/') ? '' : '/'}${sound.url}`;
    const protocolUrl = `soundpad://sound/url/${encodeURI(absoluteUrl)}`;
    const link = document.createElement('a');
    link.href = protocolUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Отправлено в SoundPad. Если приложение не открыто, запустите SoundPad и повторите.');
  };

  const ensureCommentsLoaded = useCallback((soundId: string) => {
    if (commentsBySound[soundId]?.length) return;
    fetchComments(soundId)
      .then((items) => {
        setCommentsBySound((prev) => ({
          ...prev,
          [soundId]: items.map((comment) => ({ ...comment, createdAt: new Date(comment.createdAt) })),
        }));
      })
      .catch(() => undefined);
  }, [commentsBySound]);

  const recentSounds = useMemo(
    () => recentSoundIds.map(id => sounds.find(s => s.id === id)).filter(Boolean) as Sound[],
    [recentSoundIds, sounds],
  );

  const recentPlaylists = useMemo(() => playlists.slice(0, 3), [playlists]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    sounds.forEach(sound => {
      sound.tags.forEach(tag => {
        const normalized = tag.trim().toLowerCase();
        if (normalized && normalized !== 'none') set.add(normalized);
      });
      const genre = sound.genre?.trim().toLowerCase();
      if (genre && genre !== 'none') set.add(genre);
    });
    return ['all', ...[...set].slice(0, 16)];
  }, [sounds]);

  const categorized = useMemo(() => {
    if (regionFilter === 'all') return sounds;
    return sounds.filter(s => s.tags.some(t => t.toLowerCase().includes(regionFilter)));
  }, [sounds, regionFilter]);

  const trendingSounds = useMemo(
    () => {
      const ranked = [...categorized].sort((a, b) => {
        const scoreA = (preferPopular ? a.plays * 3 + a.likes * 4 : a.plays * 2 + a.likes * 3) + (preferTranslated && a.lyrics ? 8 : 0);
        const scoreB = (preferPopular ? b.plays * 3 + b.likes * 4 : b.plays * 2 + b.likes * 3) + (preferTranslated && b.lyrics ? 8 : 0);
        return scoreB - scoreA;
      });
      return ranked;
    },
    [categorized, preferPopular, preferTranslated],
  );
  const likedSounds = useMemo(() => sounds.filter(s => likedIds.has(s.id)), [sounds, likedIds]);

  const searchResults = searchQuery.trim()
    ? [...sounds]
        .filter(s => similarity(`${s.title} ${s.tags.join(' ')}`, searchQuery) > 0)
        .sort((a, b) => similarity(`${b.title} ${b.tags.join(' ')}`, searchQuery) - similarity(`${a.title} ${a.tags.join(' ')}`, searchQuery))
    : [];

  const currentSoundTime = playerState.currentSound ? playerState.currentTime : 0;
  const activeLyricIndex = useMemo(() => {
    if (!playerState.currentSound || !lyricsLines.length) return 0;
    const segment = playerState.currentSound.duration / lyricsLines.length || 1;
    return Math.min(lyricsLines.length - 1, Math.max(0, Math.floor(currentSoundTime / segment)));
  }, [playerState.currentSound, lyricsLines, currentSoundTime]);

  const commonProps = {
    currentSound: playerState.currentSound,
    isPlaying: playerState.isPlaying,
    currentTime: currentSoundTime,
    likedIds,
    onPlay: playSound,
    onLike: toggleLikeSound,
    onDownload: downloadSound,
    onAddToSoundpad: addToSoundpad,
    commentsBySound,
    clientId,
    onCommentAdd: handleAddComment,
    onCommentLike: handleLikeComment,
    onCommentDelete: handleDeleteComment,
    onCommentOpen: ensureCommentsLoaded,
    compact: isMobile,
    showCover: showCovers,
    coverBlur,
  };

  const handleTogglePlay = () => {
    ensureAudioGraph();
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const cycleBoost = () => {
    const steps = [1, 1.5, 2, 3, 5, 8, 10];
    setAudioBoost((prev) => {
      const idx = steps.findIndex((x) => x === prev);
      const next = steps[(idx + 1) % steps.length];
      showToast(`Усиление x${next.toFixed(1)}`);
      return next;
    });
  };

  const renderPage = () => {
    if (searchQuery.trim()) {
      return <SearchPage query={searchQuery} results={searchResults} allSounds={sounds} {...commonProps} />;
    }

    if (page === 'home') {
      return (
        <SoundGrid
          title={lang === 'ru' ? 'Свежее' : 'Fresh'}
          sounds={trendingSounds}
          allSounds={sounds}
          showRegionFilter
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          categories={categories}
          lang={lang}
          topBanner={(
            <div style={{
              height: isMobile ? 120 : 170,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              marginBottom: 16,
              position: 'relative',
              background: '#070707',
            }}>
              <a
                href={bannerIndex === 0 ? 'https://funpay.com' : 'https://t.me/WMusic67'}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', width: '100%', height: '100%' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: bannerIndex === 0 ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    backgroundImage: 'url(https://cs19.pikabu.ru/s/2026/01/13/22/rm7ewgfm.jpg)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: bannerIndex === 1 ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    background: 'linear-gradient(130deg, #0e0e0e 0%, #1f0c0c 40%, #120909 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: isMobile ? 16 : 30,
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '0 28px',
                    lineHeight: 1.2,
                  }}
                >
                  Заказывайте у нас рекламу https://t.me/WMusic67 от поддержки WMusic
                </div>
              </a>
            </div>
          )}
          {...commonProps}
        />
      );
    }
    if (page === 'music') {
      return <ChartsPage sounds={sounds} title={lang === 'ru' ? 'Музыка' : 'Music'} layout="list" lang={lang} {...commonProps} />;
    }
    if (page === 'favorites') {
      return <LibraryPage likedSounds={likedSounds} allSounds={sounds} onPlaylistsChanged={syncPlaylists} lang={lang} {...commonProps} />;
    }
    if (page === 'request_sound') {
      window.open('https://t.me/WMusic67', '_blank');
      setPage('home');
      return null;
    }
    if (page === 'rights') {
      return (
        <div style={{ padding: isMobile ? '14px 12px 100px' : '24px 24px 100px', width: '100%' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Защита прав</h1>
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '22px',
              lineHeight: 1.75,
              color: '#d5d5d5',
              maxWidth: '100%',
            }}
          >
            <p style={{ marginBottom: 14 }}>
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>Базовые гарантии платформы.</span>{' '}
              WMusic обеспечивает равные условия публикации и прослушивания. Любые формы оскорблений, кражи авторского материала,
              целенаправленной травли, мошенничества и несанкционированного копирования контента запрещены.
            </p>
            <p style={{ marginBottom: 14 }}>
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>Авторство и права на музыку.</span>{' '}
              При публикации композиции авторство сохраняется за пользователем, который загрузил материал. Платформа предоставляет
              инфраструктуру для хранения, воспроизведения и распространения в рамках правил сервиса. Незаконное присвоение материалов
              и публикация чужих работ от своего имени рассматриваются как нарушение с приоритетной проверкой.
            </p>
            <p style={{ marginBottom: 14 }}>
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>Безопасность данных и среды.</span>{' '}
              WMusic применяет технические меры для защиты пользовательского контента и стабильности работы платформы.
              Мы поддерживаем прозрачную модерацию, фиксируем подозрительную активность и оперативно реагируем на обращения
              по вопросам безопасности и нарушения прав.
            </p>
            <p style={{ marginBottom: 14 }}>
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>Защита дизайна и интерфейса.</span>{' '}
              Визуальная система, структура интерфейса и фирменные элементы WMusic являются частью интеллектуального продукта.
              Незаконное копирование дизайна, имитация брендовых элементов и распространение производных клонов без согласования запрещены.
            </p>
            <p>
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>Обращения правообладателей.</span>{' '}
              Если вы обнаружили нарушение авторских прав или неправомерное использование материалов, отправьте обращение в поддержку.
              Такие запросы рассматриваются в приоритетном порядке с фиксацией решения и сроков обработки.
            </p>
          </div>
        </div>
      );
    }

    return <SoundGrid title="Свежее" sounds={trendingSounds} allSounds={sounds} showRegionFilter regionFilter={regionFilter} setRegionFilter={setRegionFilter} lang={lang} {...commonProps} />;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 36%), #000',
      overflow: 'hidden',
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setPlayerState(prev => (prev.isPlaying ? { ...prev, isPlaying: false } : prev))}
        onPlay={() => setPlayerState(prev => (!prev.isPlaying ? { ...prev, isPlaying: true } : prev))}
      />

      <Header
        searchQuery={searchQuery}
        onSearchChange={(q: string) => {
          setSearchQuery(q);
          if (q.trim()) setPage('search');
        }}
        isMobile={isMobile}
        onMenuClick={() => setMobileNavOpen((open) => !open)}
        onUploadClick={() => setShowUpload(true)}
        onLogoClick={() => {
          setPage('home');
          setSearchQuery('');
        }}
        onSettingsClick={() => setShowSettings(true)}
          lang={lang}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          currentPage={page}
          onNavigate={(p: Page) => {
            setPage(p);
            setSearchQuery('');
          }}
          recentSounds={recentSounds}
          recentPlaylists={recentPlaylists}
          onPlayRecent={playSound}
          onOpenPlaylist={(playlist) => {
            const list = sounds.filter(s => playlist.soundIds.includes(s.id));
            if (list.length) playSound(list[0], list);
            setPage('favorites');
          }}
          isMobile={isMobile}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          lang={lang}
        />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,1) 100%)',
          paddingBottom: isMobile ? (playerState.currentSound ? 120 : 86) : 0,
        }}>
          {renderPage()}
        </main>

        {nowPlayingOpen && playerState.currentSound && (
          <NowPlayingPanel
            sound={playerState.currentSound}
            queue={playerState.queue.filter((_, i) => i > playerState.currentIndex)}
            likedIds={likedIds}
            onClose={() => setNowPlayingOpen(false)}
            onPlay={playSound}
            onLike={toggleLikeSound}
            compact={isMobile}
            lang={lang}
            showCover={showCovers}
          />
        )}
      </div>

      {lyricsOpen && playerState.currentSound && (
        <div
          style={{
            position: 'fixed',
            left: isMobile ? 12 : 260,
            right: isMobile ? 12 : nowPlayingOpen ? 316 : 16,
            bottom: playerState.currentSound ? 84 : 16,
            maxHeight: isMobile ? 210 : 250,
            background: 'rgba(0,0,0,0.84)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            backdropFilter: 'blur(12px)',
            padding: '12px 14px',
            overflowY: 'auto',
            zIndex: 75,
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: '#808080', marginBottom: 8 }}>
            Текст композиции
          </div>
          {lyricsLines.map((line, index) => (
            <div
              key={`${line}-${index}`}
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: index === activeLyricIndex ? '#ffffff' : '#8a8a8a',
                fontWeight: index === activeLyricIndex ? 700 : 500,
                transition: 'all 0.15s ease',
                marginBottom: 4,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {playerState.currentSound && (
        <BottomPlayer
          state={playerState}
          likedIds={likedIds}
          onTogglePlay={handleTogglePlay}
          onSeek={seek}
          onVolume={(v: number) => setPlayerState(prev => ({ ...prev, volume: v }))}
          onNext={playNext}
          onPrev={playPrev}
          onShuffle={() => setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }))}
          onRepeat={() => setPlayerState(prev => ({ ...prev, repeat: !prev.repeat }))}
          onLike={toggleLikeSound}
          onNowPlaying={() => setNowPlayingOpen(open => !open)}
          onLyrics={() => setLyricsOpen((open) => !open)}
          lyricsOpen={lyricsOpen}
          boostLevel={audioBoost}
          onBoostCycle={cycleBoost}
          compact={isMobile}
          lang={lang}
        />
      )}

      {isMobile && !playerState.currentSound && (
        <MobileTabBar
          currentPage={page}
          onNavigate={(nextPage) => {
            setPage(nextPage);
            setSearchQuery('');
          }}
        />
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={addSound} availableGenres={categories.filter(c => c !== 'all')} />}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          quality={audioQuality}
          crossfade={crossfadeEnabled}
          onQualityChange={setAudioQuality}
          onCrossfadeChange={setCrossfadeEnabled}
          showCovers={showCovers}
          onShowCoversChange={setShowCovers}
          coverBlur={coverBlur}
          onCoverBlurChange={setCoverBlur}
          preferTranslated={preferTranslated}
          onPreferTranslatedChange={setPreferTranslated}
          preferPopular={preferPopular}
          onPreferPopularChange={setPreferPopular}
          showVolumeWarning={showVolumeWarning}
          onShowVolumeWarningChange={setShowVolumeWarning}
        />
      )}

      {showBrowserCheck && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center', width: 340, maxWidth: '92vw' }}>
            <div
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 18px',
                borderRadius: '50%',
                border: '4px solid #2b2b2b',
                borderTopColor: '#ffffff',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            <div style={{ fontSize: 18, fontWeight: 800 }}>Проверяем ваш браузер</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#a0a0a0' }}>
              Cookies: {browserCheckResult?.cookiesEnabled ? 'OK' : 'OFF'} • Bot score: {browserCheckResult?.botScore ?? 0}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#d2d2d2', letterSpacing: 1.1 }}>
              {browserCheckResult?.token ?? '000000-000000'}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: playerState.currentSound ? 90 : 16, background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 16px', fontSize: 13, zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
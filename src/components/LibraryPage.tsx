import { useState } from 'react';
import { Sound, Playlist } from '../types';
import SoundCard from './SoundCard';
import { localizeTitle } from '../utils/text';

interface LibraryPageProps {
  likedSounds: Sound[];
  allSounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  currentTime?: number;
  likedIds: Set<string>;
  onPlay: (sound: Sound, all: Sound[]) => void;
  onLike: (id: string) => void;
  onDownload: (sound: Sound) => void;
  onPlaylistsChanged?: () => void;
  compact?: boolean;
  lang?: 'ru' | 'en';
}

export default function LibraryPage({ likedSounds, allSounds, currentSound, isPlaying, currentTime = 0, likedIds, onPlay, onLike, onDownload, onPlaylistsChanged, compact = false, lang = 'ru' }: LibraryPageProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const s = localStorage.getItem('wmusic_playlists');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const createPlaylist = () => {
    if (!newName.trim()) return;
    const pl: Playlist = {
      id: Date.now().toString(),
      name: newName.trim(),
      soundIds: [],
      createdAt: new Date(),
    };
    const updated = [...playlists, pl];
    setPlaylists(updated);
    localStorage.setItem('wmusic_playlists', JSON.stringify(updated));
    onPlaylistsChanged?.();
    setNewName('');
    setShowCreate(false);
  };

  const addToPlaylist = (soundId: string) => {
    if (!playlists.length) {
      setShowCreate(true);
      return;
    }
    const picked = window.prompt(`Введите название плейлиста:\n${playlists.map(p => `- ${p.name}`).join('\n')}`);
    if (!picked) return;
    const target = playlists.find(p => p.name.toLowerCase() === picked.toLowerCase());
    if (!target) return;
    const updated = playlists.map(p => {
      if (p.id !== target.id) return p;
      if (p.soundIds.includes(soundId)) return p;
      return { ...p, soundIds: [...p.soundIds, soundId] };
    });
    setPlaylists(updated);
    localStorage.setItem('wmusic_playlists', JSON.stringify(updated));
    onPlaylistsChanged?.();
  };

  if (selectedPlaylist) {
    const playlistSounds = allSounds.filter(s => selectedPlaylist.soundIds.includes(s.id));
    return (
      <div style={{ padding: '24px 24px 100px' }}>
        <button
          onClick={() => setSelectedPlaylist(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#888', fontSize: '13px', marginBottom: '16px', padding: '0',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#888'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Назад к библиотеке
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>{selectedPlaylist.name}</h1>
        {playlistSounds.length === 0 ? (
          <div style={{ color: '#444', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
            Плейлист пуст
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlistSounds.map(s => (
              <SoundCard
                key={s.id}
                sound={s}
                isCurrentlyPlaying={isPlaying}
                isActive={currentSound?.id === s.id}
                liked={likedIds.has(s.id)}
                currentTime={currentSound?.id === s.id ? currentTime : 0}
                onPlay={sound => onPlay(sound, playlistSounds)}
                onLike={onLike}
                onDownload={onDownload}
                onAddToSoundpad={() => {}}
                onComment={() => {}}
                layout="list"
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: compact ? '14px 12px 100px' : '24px 24px 100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>Избранные</h1>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {/* Liked songs */}
        <div
          onClick={() => {}}
          style={{
            background: 'linear-gradient(135deg, rgba(100,50,200,0.4), rgba(20,20,60,0.8))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '160px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.1)'}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Плейлист</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Понравившиеся</div>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{likedSounds.length} треков</div>
        </div>

        {/* Playlists */}
        {playlists.map(pl => (
          <div
            key={pl.id}
            onClick={() => setSelectedPlaylist(pl)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: '160px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Плейлист</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{pl.name}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>{pl.soundIds.length} треков</div>
          </div>
        ))}

        {/* Create playlist */}
        {showCreate ? (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '20px',
            minHeight: '160px',
          }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Название плейлиста"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') createPlaylist(); if (e.key === 'Escape') setShowCreate(false); }}
              style={{ marginBottom: '10px', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createPlaylist} className="btn-primary" style={{ fontSize: '13px', padding: '7px 14px' }}>Создать</button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }}>Отмена</button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowCreate(true)}
            style={{
              background: 'transparent',
              border: '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              minHeight: '160px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              color: '#555',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLDivElement).style.color = '#888'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLDivElement).style.color = '#555'; }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Создать плейлист</span>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Понравившиеся песни</h2>
      {likedSounds.length === 0 ? (
        <div style={{ color: '#555', fontSize: '13px', marginBottom: '24px' }}>Пока пусто. Нажмите сердце на карточке, чтобы добавить в избранное.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          {likedSounds.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', flexWrap: compact ? 'wrap' : 'nowrap' }}>
              <button onClick={() => onPlay(s, likedSounds)} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Play</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{localizeTitle(s.title, lang)}</div>
                <div style={{ color: '#666', fontSize: 12 }}>Anonymous</div>
              </div>
              <button onClick={() => addToPlaylist(s.id)} className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }}>Добавить в плейлист</button>
              <button onClick={() => onLike(s.id)} className="btn-ghost" style={{ padding: '7px 10px', fontSize: 12 }}>{likedIds.has(s.id) ? 'Убрать' : 'Лайк'}</button>
            </div>
          ))}
        </div>
      )}

      {/* Мои плейлисты */}
      {playlists.length > 0 && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Мои плейлисты</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ddd' }}>{pl.name}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>{pl.soundIds.length} треков</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

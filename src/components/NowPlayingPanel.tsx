import { useState } from 'react';
import { Sound } from '../types';
import { localizeTitle } from '../utils/text';

interface NowPlayingPanelProps {
  sound: Sound;
  queue: Sound[];
  likedIds: Set<string>;
  onClose: () => void;
  onPlay: (sound: Sound, all: Sound[]) => void;
  onLike: (id: string) => void;
  compact?: boolean;
  lang?: 'ru' | 'en';
  showCover?: boolean;
}

export default function NowPlayingPanel({ sound, queue, likedIds, onClose, onPlay, onLike, compact = false, lang = 'ru', showCover = true }: NowPlayingPanelProps) {
  const [queueOpen, setQueueOpen] = useState(true);
  const liked = likedIds.has(sound.id);

  return (
    <aside style={{
      width: compact ? '100%' : '300px',
      flexShrink: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(24px)',
      borderLeft: compact ? 'none' : '1px solid rgba(255,255,255,0.07)',
      borderTop: compact ? '1px solid rgba(255,255,255,0.09)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideInRight 0.25s ease',
      position: compact ? 'fixed' : 'relative',
      left: compact ? 0 : undefined,
      right: compact ? 0 : undefined,
      bottom: compact ? 92 : undefined,
      top: compact ? '15%' : undefined,
      zIndex: compact ? 120 : 'auto',
      borderTopLeftRadius: compact ? '16px' : 0,
      borderTopRightRadius: compact ? '16px' : 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Сейчас играет</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '4px', display: 'flex', transition: 'color 0.15s', borderRadius: '4px' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#666'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Cover */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{
          width: '100%',
          paddingBottom: '100%',
          position: 'relative',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          {showCover && sound.coverUrl ? (
            <img
              src={sound.coverUrl}
              alt={sound.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Track info */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px', lineHeight: '1.3' }}>
          {localizeTitle(sound.title, lang)}
        </div>
        <div style={{ fontSize: '13px', color: '#555' }}>Anonymous</div>

        {/* Tags */}
        {sound.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {sound.tags.map(t => (
              <span key={t} style={{
                background: 'rgba(255,255,255,0.07)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                color: '#888',
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Like */}
        <button
          onClick={() => onLike(sound.id)}
          style={{
            marginTop: '12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: liked ? 'rgba(229,57,53,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${liked ? 'rgba(229,57,53,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px', padding: '7px 14px', cursor: 'pointer',
            color: liked ? '#e53935' : '#888', fontSize: '13px',
            transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {liked ? 'Лайк поставлен' : 'Поставить лайк'}
        </button>

        {sound.description && (
          <div style={{ marginTop: '12px', fontSize: '12px', lineHeight: 1.55, color: '#9a9a9a' }}>
            {sound.description}
          </div>
        )}
      </div>

      {/* Queue */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          onClick={() => setQueueOpen(p => !p)}
          style={{
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
            Следующий в очереди
            {queue.length > 0 && (
              <span style={{ fontSize: '11px', color: '#555', marginLeft: '6px' }}>({queue.length})</span>
            )}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: queueOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {queueOpen && (
          <div style={{ paddingBottom: '8px' }}>
            {queue.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#444', textAlign: 'center' }}>
                Очередь пуста
              </div>
            ) : (
              queue.slice(0, 20).map(s => (
                <div
                  key={s.id}
                  onClick={() => onPlay(s, queue)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 16px', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '6px', flexShrink: 0,
                    background: s.coverUrl ? `url(${s.coverUrl}) center/cover` : 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!s.coverUrl && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {localizeTitle(s.title, lang)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Anonymous</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

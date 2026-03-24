import { useState, useCallback } from 'react';
import { Sound } from '../types';
import { localizeTitle } from '../utils/text';

interface SoundComment {
  id: string;
  text: string;
  likes: number;
  parentId?: string;
  ownerId?: string;
}

interface SoundCardProps {
  sound: Sound;
  isCurrentlyPlaying: boolean;
  isActive: boolean;
  currentTime?: number;
  liked: boolean;
  onPlay: (sound: Sound) => void;
  onLike: (id: string) => void;
  onDownload: (sound: Sound) => void;
  onAddToSoundpad: (sound: Sound) => void;
  comments?: SoundComment[];
  currentClientId?: string;
  onComment: (sound: Sound) => void;
  onCommentAdd?: (soundId: string, text: string, parentId?: string) => void;
  onCommentLike?: (commentId: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onDelete?: (soundId: string) => void;
  layout?: 'grid' | 'list';
  compact?: boolean;
  lang?: 'ru' | 'en';
  showCover?: boolean;
  coverBlur?: number;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Random waveform heights (fixed per sound id)
function getWaveHeights(id: string, count = 40): number[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = ((hash << 5) - hash) + i * 7;
    heights.push(20 + Math.abs(hash % 60));
  }
  return heights;
}

// Gradient colors based on tags/title
function getWaveColor(sound: Sound): { from: string; to: string } {
  const tags = sound.tags.join(' ').toLowerCase() + sound.title.toLowerCase();
  if (tags.includes('rock') || tags.includes('метал') || tags.includes('heavy')) return { from: '#ff4444', to: '#ff8800' };
  if (tags.includes('trap') || tags.includes('phonk') || tags.includes('bass') || tags.includes('rap')) return { from: '#9c27b0', to: '#3f51b5' };
  if (tags.includes('chill') || tags.includes('lofi') || tags.includes('ambient')) return { from: '#00bcd4', to: '#2196f3' };
  if (tags.includes('смешно') || tags.includes('мем') || tags.includes('funny')) return { from: '#ff9800', to: '#ffeb3b' };
  if (tags.includes('pop') || tags.includes('dance')) return { from: '#e91e63', to: '#9c27b0' };
  // default
  return { from: '#ffffff', to: '#888888' };
}

export default function SoundCard({
  sound,
  isCurrentlyPlaying,
  isActive,
  currentTime = 0,
  liked,
  onPlay,
  onLike,
  onDownload,
  onAddToSoundpad,
  comments = [],
  currentClientId,
  onComment,
  onCommentAdd,
  onCommentLike,
  onCommentDelete,
  onDelete,
  layout = 'grid',
  compact = false,
  lang = 'ru',
  showCover = true,
  coverBlur = 7,
}: SoundCardProps) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');

  const heights = getWaveHeights(sound.id);
  const waveColor = getWaveColor(sound);
  const shownTitle = localizeTitle(sound.title, lang);

  const handlePlay = useCallback(() => {
    onPlay(sound);
  }, [isActive, isCurrentlyPlaying, onPlay, sound]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(sound);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(sound.id);
  };

  const handleAddSoundpad = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToSoundpad(sound);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCommentBox(p => !p);
    onComment(sound);
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    onCommentAdd?.(sound.id, commentText.trim());
    setCommentText('');
  };

  const totalComments = comments.length;

  if (layout === 'list') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderRadius: '8px',
        transition: 'background 0.15s',
        cursor: 'pointer',
        animation: 'fadeIn 0.2s ease',
      }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        <button
          onClick={handlePlay}
          style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: isActive ? '#fff' : 'rgba(255,255,255,0.1)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isActive ? '#000' : '#fff', flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {isActive && isCurrentlyPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
           <div style={{ fontSize: '14px', fontWeight: '600', color: isActive ? '#fff' : '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shownTitle}</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>Anonymous</div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}>{sound.plays}</div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {sound.tags.slice(0, 2).map(t => <span key={t} className="tag-pill">{t}</span>)}
        </div>
        <div style={{ fontSize: '12px', color: '#555', flexShrink: 0 }}>
          {Math.floor((Date.now() - new Date(sound.uploadedAt).getTime()) / 86400000)} д. назад
        </div>
        <div style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}>{formatDuration(sound.duration)}</div>
        <button onClick={handleDownload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', flexShrink: 0, display: 'flex', padding: '4px' }}
          title="Скачать"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sound.id);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff5a5a', flexShrink: 0, display: 'flex', padding: '4px' }}
            title="Удалить"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="sound-card"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: compact ? '12px' : '10px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        animation: 'fadeIn 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.18)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.border = isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      {/* Cover / Waveform area */}
      <div
        style={{
          position: 'relative',
          height: compact ? '104px' : '120px',
          background: showCover && sound.coverUrl ? `url(${sound.coverUrl}) center/cover` : 'rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
        onClick={handlePlay}
      >
        {showCover && sound.coverUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: `blur(${coverBlur}px)`,
              WebkitBackdropFilter: `blur(${coverBlur}px)`,
            }}
          />
        )}
        {/* Duration badge */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          borderRadius: '4px',
          padding: '2px 7px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#fff',
          zIndex: 2,
        }}>
           {isActive ? formatTime(Math.floor(currentTime)) : formatDuration(sound.duration)}
        </div>

        {/* Waveform */}
        {isActive && isCurrentlyPlaying && (
          <div style={{
            position: 'absolute', bottom: '0', left: '0', right: '0',
            display: 'flex', alignItems: 'flex-end', gap: '2px',
            padding: '0 12px 10px',
            height: '80px',
            zIndex: 1,
          }}>
            {heights.map((h, i) => {
              const ratio = sound.duration > 0 ? currentTime / sound.duration : 0;
              const isPlayed = i / heights.length < ratio;
              return (
                <div
                  key={i}
                  className={`waveform-bar${isActive && isCurrentlyPlaying ? ' playing' : ''}`}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    maxHeight: '60px',
                    background: isPlayed
                      ? `linear-gradient(to top, ${waveColor.from}, ${waveColor.to})`
                      : 'rgba(255,255,255,0.25)',
                    borderRadius: '2px',
                    animationDelay: `${(i * 0.04) % 0.6}s`,
                    transition: 'background 0.15s',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Play button */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <button
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: '#fff',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.65)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {isActive && isCurrentlyPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
        </div>

        {/* SoundPad overlay */}
        {!compact && (
          <div
            className="soundpad-overlay"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
              padding: compact ? '6px 8px' : '8px 12px',
              zIndex: 3,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleAddSoundpad}
              style={{
                width: '100%',
                background: 'rgba(30,30,30,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: compact ? '11px' : '12px',
                fontWeight: '600',
                padding: compact ? '6px' : '7px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(60,60,60,0.95)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,30,30,0.9)'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              Добавить в SoundPad
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: compact ? '9px 9px' : '10px 12px' }}>
        {/* Title */}
        <div style={{
          fontSize: '13.5px', fontWeight: '600', color: '#fff',
          marginBottom: compact ? '6px' : '8px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {shownTitle}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: compact ? '6px' : '8px' }}>
          {sound.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '10px', fontSize: compact ? '11px' : '12px', color: '#666' }}>
          {/* Like */}
          <button
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: liked ? '#e53935' : '#666',
              fontSize: '12px',
              padding: '0',
              transition: 'color 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {sound.likes}
          </button>

          {/* Comment */}
          <button
            onClick={handleComment}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: showCommentBox ? '#fff' : '#666', fontSize: '12px', padding: '0',
              transition: 'color 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {totalComments}
          </button>

          {/* Plays */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
            {sound.plays}
          </span>

          {/* Download */}
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#666', fontSize: '12px', padding: '0',
              transition: 'color 0.15s',
              marginLeft: 'auto',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#666'}
            title="Скачать"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {sound.downloads}
          </button>
        </div>

        {/* Anonymous label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginTop: '8px', paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span style={{ fontSize: '11px', color: '#555' }}>Anonymous</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#444' }}>
            {(() => {
              const diff = Date.now() - new Date(sound.uploadedAt).getTime();
              const mins = Math.floor(diff / 60000);
              const hrs = Math.floor(diff / 3600000);
              const days = Math.floor(diff / 86400000);
              if (days > 0) return `${days} д. назад`;
              if (hrs > 0) return `${hrs} ч. назад`;
              return `${mins} мин. назад`;
            })()}
          </span>
        </div>
      </div>

      {/* Comment box */}
      {showCommentBox && (
        <div style={{ padding: '0 12px 12px', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '10px' }} />
          {comments.map((c) => (
            <div key={c.id} style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px', padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}>
              <div style={{ color: '#666', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span>Anonymous:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onCommentLike?.(c.id)}
                    style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', fontSize: '11px' }}
                  >
                    ♥ {c.likes}
                  </button>
                  {currentClientId && c.ownerId === currentClientId && (
                    <button
                      onClick={() => onCommentDelete?.(c.id)}
                      style={{ background: 'none', border: 'none', color: '#ff7070', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
              {c.text}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Написать комментарий..."
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
              style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
            />
            <button onClick={submitComment} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

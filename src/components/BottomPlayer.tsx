import { useEffect, useRef, useState } from 'react';
import { PlayerState } from '../types';
import { localizeTitle } from '../utils/text';

interface BottomPlayerProps {
  state: PlayerState;
  likedIds: Set<string>;
  onTogglePlay: () => void;
  onSeek: (ratio: number) => void;
  onVolume: (v: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onLike: (id: string) => void;
  onNowPlaying: () => void;
  onLyrics: () => void;
  lyricsOpen: boolean;
  boostLevel: number;
  onBoostCycle: () => void;
  compact?: boolean;
  lang?: 'ru' | 'en';
}

function fmtTime(secs: number): string {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function IconBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? '#fff' : '#888',
        padding: '8px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        fontSize: '0',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = active ? '#fff' : '#888'}
    >
      {children}
    </button>
  );
}

export default function BottomPlayer({
  state, likedIds, onTogglePlay, onSeek, onVolume,
  onNext, onPrev, onShuffle, onRepeat, onLike, onNowPlaying, onLyrics, lyricsOpen, boostLevel, onBoostCycle,
  compact = false,
  lang = 'ru',
}: BottomPlayerProps) {
  const { currentSound, isPlaying, progress, volume, shuffle, repeat, currentTime } = state;
  const progressRef = useRef<HTMLDivElement>(null);
  const volRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (!currentSound) return null;

  const duration = currentSound.duration || 0;
  const liked = likedIds.has(currentSound.id);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  const seekFromClientX = (clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const rect = progressRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio);
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, onSeek]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      seekFromClientX(touch.clientX);
    };
    const up = () => setDragging(false);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, onSeek]);

  if (compact) {
    return (
      <div style={{
        minHeight: '92px',
        background: 'rgba(0,0,0,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 10px 10px',
        position: 'relative',
        zIndex: 50,
      }}>
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseDown={e => {
            setDragging(true);
            handleProgressClick(e);
          }}
          onTouchStart={e => {
            const touch = e.touches[0];
            if (!touch) return;
            setDragging(true);
            seekFromClientX(touch.clientX);
          }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'rgba(255,255,255,0.12)', cursor: 'pointer',
          }}
        >
          <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg,#fff,#a9a9a9)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: currentSound.coverUrl ? `url(${currentSound.coverUrl}) center/cover` : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {localizeTitle(currentSound.title, lang)}
            </div>
            <div style={{ fontSize: 11, color: '#6f6f6f' }}>{fmtTime(currentTime)} / {fmtTime(duration)}</div>
          </div>
          <button
            onClick={() => onLike(currentSound.id)}
            style={{ border: 'none', background: 'none', color: liked ? '#e53935' : '#8a8a8a', padding: 6 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBtn onClick={onPrev} title="Назад">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </IconBtn>
          <button
            onClick={onTogglePlay}
            style={{
              width: '42px', height: '42px', borderRadius: '50%', background: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
            }}
          >
            {isPlaying ? <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
          </button>
          <IconBtn onClick={onNext} title="Вперёд">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </IconBtn>

          <button
            onClick={onLyrics}
            style={{
              marginLeft: 'auto',
              background: lyricsOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#ddd',
              padding: '7px 8px', fontSize: 11,
            }}
          >
            Текст
          </button>
          <button
            onClick={onNowPlaying}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#ddd',
              padding: '7px 8px', fontSize: 11,
            }}
          >
            Очередь
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: compact ? '78px' : '72px',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      padding: compact ? '0 10px' : '0 20px',
      gap: compact ? '10px' : '16px',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Progress bar - full width absolute */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseDown={e => {
          setDragging(true);
          handleProgressClick(e);
        }}
        onTouchStart={e => {
          const touch = e.touches[0];
          if (!touch) return;
          setDragging(true);
          seekFromClientX(touch.clientX);
        }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #ffffff 0%, #aaaaaa 100%)',
          transition: 'width 0.1s linear',
        }} />
        <div style={{
          position: 'absolute',
          left: `${progress * 100}%`,
          top: '50%',
          width: '13px',
          height: '13px',
          borderRadius: '50%',
          background: '#fff',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.35)',
        }} />
      </div>

      {/* Left: track info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: compact ? '140px' : '200px', flex: 1 }}>
        {/* Cover */}
        <div style={{
          width: '46px', height: '46px', borderRadius: '8px', flexShrink: 0,
          background: currentSound.coverUrl ? `url(${currentSound.coverUrl}) center/cover` : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {!currentSound.coverUrl && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {localizeTitle(currentSound.title, lang)}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Anonymous</div>
        </div>

        {/* Like */}
        <button
          onClick={() => onLike(currentSound.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: liked ? '#e53935' : '#666', padding: '6px',
            display: 'flex', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = liked ? '#e53935' : '#aaa'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = liked ? '#e53935' : '#666'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Center: controls */}
       <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '2px' : '8px' }}>
        <IconBtn onClick={onShuffle} active={shuffle} title="Перемешать">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            <line x1="4" y1="4" x2="9" y2="9"/>
          </svg>
        </IconBtn>

        <IconBtn onClick={onPrev} title="Назад">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
          </svg>
        </IconBtn>

        <button
          onClick={onTogglePlay}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>

        <IconBtn onClick={onNext} title="Вперёд">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </IconBtn>

        <IconBtn onClick={onRepeat} active={repeat} title="Повторить">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        </IconBtn>
      </div>

      {/* Time */}
       {!compact && <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
        {fmtTime(currentTime)} / {fmtTime(duration)}
       </div>}

      {/* Right: volume + now playing */}
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
        {/* Volume */}
         {!compact && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onVolume(volume === 0 ? 0.8 : 0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: '4px', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#888'}
          >
            {volume === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : volume < 0.5 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <div style={{ position: 'relative', width: '90px', height: '4px' }}>
            <div style={{
              position: 'absolute', inset: 0, background: '#222', borderRadius: '2px',
            }} />
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${volume * 100}%`,
              background: '#fff', borderRadius: '2px',
            }} />
            <input
              ref={volRef}
              type="range"
              min="0" max="1" step="0.01"
              value={volume}
              onChange={e => onVolume(parseFloat(e.target.value))}
              style={{
                position: 'absolute', inset: 0, width: '100%', margin: 0,
                opacity: 0, cursor: 'pointer',
              }}
            />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: `${volume * 100}%`,
              top: '50%',
              width: '14px', height: '14px',
              background: '#fff',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }} />
          </div>

          {!compact && (
            <button
              onClick={onBoostCycle}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: boostLevel > 1 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: boostLevel > 1 ? '#fff' : '#aaa', cursor: 'pointer',
                padding: '7px 10px', fontSize: '12px', fontWeight: '600',
              }}
              title="Усиление громкости"
            >
              BOOST x{boostLevel.toFixed(1)}
            </button>
          )}
         </div>}

         <button
           onClick={onLyrics}
           style={{
             display: 'flex', alignItems: 'center', gap: '6px',
             background: lyricsOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
             border: '1px solid rgba(255,255,255,0.12)',
             borderRadius: '8px', color: lyricsOpen ? '#fff' : '#aaa', cursor: 'pointer',
             padding: compact ? '7px 10px' : '7px 12px', fontSize: '12px', fontWeight: '500',
             transition: 'all 0.15s',
           }}
         >
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <path d="M4 7h16M4 12h12M4 17h9" />
           </svg>
           Текст
         </button>
        {/* Now playing panel toggle */}
         {!compact && <button
          onClick={onNowPlaying}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: '#aaa', cursor: 'pointer',
            padding: '7px 12px', fontSize: '12px', fontWeight: '500',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLButtonElement).style.color = '#aaa';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
           Очередь
         </button>}

      </div>
    </div>
  );
}

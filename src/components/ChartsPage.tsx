import { Sound } from '../types';
import SoundCard from './SoundCard';
import { localizeTitle } from '../utils/text';

interface ChartsPageProps {
  sounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  currentTime?: number;
  likedIds: Set<string>;
  onPlay: (sound: Sound, all: Sound[]) => void;
  onLike: (id: string) => void;
  onDownload: (sound: Sound) => void;
  title?: string;
  layout?: 'grid' | 'list';
  compact?: boolean;
  lang?: 'ru' | 'en';
}

export default function ChartsPage({ sounds, currentSound, isPlaying, currentTime = 0, likedIds, onPlay, onLike, onDownload, title = 'Музыка', layout = 'list', compact = false, lang = 'ru' }: ChartsPageProps) {
  if (compact) {
    return (
      <div style={{ padding: '14px 12px 100px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>{title}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sounds.map((s) => (
            <SoundCard
              key={s.id}
              sound={s}
              isCurrentlyPlaying={isPlaying}
              isActive={currentSound?.id === s.id}
              currentTime={currentSound?.id === s.id ? currentTime : 0}
              liked={likedIds.has(s.id)}
              onPlay={sound => onPlay(sound, sounds)}
              onLike={onLike}
              onDownload={onDownload}
              onAddToSoundpad={() => {}}
              onComment={() => {}}
              layout="list"
              lang={lang}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 24px 100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>{title}</h1>

      {sounds.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '60px 0', fontSize: '15px' }}>
          Нет треков. Загрузите первый!
        </div>
      ) : layout === 'list' ? (
        <>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 80px 140px 80px 60px 40px',
            gap: '12px',
            padding: '8px 16px',
            fontSize: '11px', fontWeight: '700', color: '#555',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '4px',
          }}>
            <div>#</div>
            <div>Название</div>
            <div style={{ textAlign: 'right' }}>Прослуш.</div>
            <div>Теги</div>
            <div>Добавлено</div>
            <div style={{ textAlign: 'right' }}>Длит.</div>
            <div />
          </div>

          {sounds.map((s, i) => {
            const isActive = currentSound?.id === s.id;
            const diff = Date.now() - new Date(s.uploadedAt).getTime();
            const days = Math.floor(diff / 86400000);
            const hrs = Math.floor(diff / 3600000);
            const addedStr = days > 0 ? `${days} д. назад` : `${hrs} ч. назад`;
            const durStr = `${Math.floor(s.duration / 60)}:${Math.floor(s.duration % 60).toString().padStart(2, '0')}`;

            return (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 80px 140px 80px 60px 40px',
                  gap: '12px',
                  padding: '10px 16px',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  animation: 'fadeIn 0.2s ease',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                onClick={() => onPlay(s, sounds)}
              >
                {/* Number / Play */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isActive && isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: '13px', color: isActive ? '#fff' : '#555', fontWeight: '600' }}>{i + 1}</span>
                  )}
                </div>

                {/* Title + author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '6px', flexShrink: 0,
                    background: s.coverUrl ? `url(${s.coverUrl}) center/cover` : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {!s.coverUrl && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isActive ? '#fff' : '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {localizeTitle(s.title, lang)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555' }}>Anonymous</div>
                  </div>
                </div>

                {/* Plays */}
                <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>{s.plays}</div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '4px', overflow: 'hidden' }}>
                  {s.tags.slice(0, 2).map(t => (
                    <span key={t} style={{
                      background: 'rgba(255,255,255,0.07)', borderRadius: '4px',
                      padding: '2px 6px', fontSize: '10px', color: '#888',
                      whiteSpace: 'nowrap',
                    }}>{t}</span>
                  ))}
                </div>

                {/* Added */}
                <div style={{ fontSize: '12px', color: '#555' }}>{addedStr}</div>

                {/* Duration */}
                <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>{durStr}</div>

                {/* Download */}
                <button
                  onClick={e => { e.stopPropagation(); onDownload(s); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: '4px', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#555'}
                  title="Скачать"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {sounds.map(s => (
            <SoundCard
              key={s.id}
              sound={s}
              isCurrentlyPlaying={isPlaying}
              isActive={currentSound?.id === s.id}
                currentTime={currentSound?.id === s.id ? currentTime : 0}
              liked={likedIds.has(s.id)}
              onPlay={sound => onPlay(sound, sounds)}
              onLike={onLike}
              onDownload={onDownload}
              onAddToSoundpad={() => {}}
              onComment={() => {}}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

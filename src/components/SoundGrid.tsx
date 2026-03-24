import SoundCard from './SoundCard';
import { Comment, Sound } from '../types';

interface SoundGridProps {
  title: string;
  topBanner?: React.ReactNode;
  sounds: Sound[];
  allSounds: Sound[];
  categories?: string[];
  regionFilter?: string;
  setRegionFilter?: (r: string) => void;
  showRegionFilter?: boolean;
  currentSound: Sound | null;
  isPlaying: boolean;
  currentTime?: number;
  likedIds: Set<string>;
  onPlay: (sound: Sound, all: Sound[]) => void;
  onLike: (id: string) => void;
  onDownload: (sound: Sound) => void;
  soundpadList?: Sound[];
  onAddToSoundpad?: (sound: Sound) => void;
  commentsBySound?: Record<string, Comment[]>;
  clientId?: string;
  onCommentAdd?: (soundId: string, text: string, parentId?: string) => void;
  onCommentLike?: (commentId: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentOpen?: (soundId: string) => void;
  onDelete?: (soundId: string) => void;
  showDelete?: boolean;
  layout?: 'grid' | 'list';
  lang?: 'ru' | 'en';
  compact?: boolean;
  showCover?: boolean;
  coverBlur?: number;
}

export default function SoundGrid({
  title, topBanner, sounds, allSounds, categories = ['all', 'rock', 'pop', 'vibe', 'trap', 'meme'], regionFilter, setRegionFilter,
  showRegionFilter, currentSound, isPlaying, currentTime = 0, likedIds,
  onPlay, onLike, onDownload, onAddToSoundpad, commentsBySound = {}, clientId, onCommentAdd, onCommentLike, onCommentDelete, onCommentOpen, onDelete, showDelete, layout = 'grid', lang = 'ru',
  compact = false, showCover = true, coverBlur = 7,
}: SoundGridProps) {
  return (
    <div style={{ padding: compact ? '14px 12px 100px' : '24px 24px 100px' }}>
      {topBanner}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{title}</h1>
      </div>

      {/* Region filter */}
      {showRegionFilter && setRegionFilter && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {categories.map(category => (
            <button
              key={category}
              className={`region-btn${regionFilter === category ? ' active' : ''}`}
              onClick={() => setRegionFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {sounds.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '60px 0', fontSize: '15px' }}>
          Звуков пока нет. Загрузите первый!
        </div>
      ) : layout === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sounds.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 0.03}s` }}>
              <SoundCard
                sound={s}
                isCurrentlyPlaying={isPlaying}
                isActive={currentSound?.id === s.id}
                liked={likedIds.has(s.id)}
                currentTime={currentSound?.id === s.id ? currentTime : 0}
                onPlay={sound => onPlay(sound, allSounds)}
                onLike={onLike}
                onDownload={onDownload}
                onAddToSoundpad={onAddToSoundpad || (() => {})}
                onComment={() => onCommentOpen?.(s.id)}
                comments={commentsBySound[s.id] || []}
                currentClientId={clientId}
                onCommentAdd={onCommentAdd}
                onCommentLike={onCommentLike}
                onCommentDelete={onCommentDelete}
                layout="list"
                onDelete={showDelete ? onDelete : undefined}
                lang={lang}
                showCover={showCover}
                coverBlur={coverBlur}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: compact ? '10px' : '14px',
        }}>
          {sounds.map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <SoundCard
                sound={s}
                isCurrentlyPlaying={isPlaying}
                isActive={currentSound?.id === s.id}
                liked={likedIds.has(s.id)}
                currentTime={currentSound?.id === s.id ? currentTime : 0}
                onPlay={sound => onPlay(sound, allSounds)}
                onLike={onLike}
                onDownload={onDownload}
                onAddToSoundpad={onAddToSoundpad || (() => {})}
                onComment={() => onCommentOpen?.(s.id)}
                comments={commentsBySound[s.id] || []}
                currentClientId={clientId}
                onCommentAdd={onCommentAdd}
                onCommentLike={onCommentLike}
                onCommentDelete={onCommentDelete}
                onDelete={showDelete ? onDelete : undefined}
                compact={compact}
                lang={lang}
                showCover={showCover}
                coverBlur={coverBlur}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

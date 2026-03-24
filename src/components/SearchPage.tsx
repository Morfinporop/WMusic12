import { Sound } from '../types';
import SoundCard from './SoundCard';

interface SearchPageProps {
  query: string;
  results: Sound[];
  allSounds: Sound[];
  currentSound: Sound | null;
  isPlaying: boolean;
  currentTime?: number;
  likedIds: Set<string>;
  onPlay: (sound: Sound, all: Sound[]) => void;
  onLike: (id: string) => void;
  onDownload: (sound: Sound) => void;
  onAddToSoundpad?: (sound: Sound) => void;
  compact?: boolean;
}

export default function SearchPage({ query, results, allSounds, currentSound, isPlaying, currentTime = 0, likedIds, onPlay, onLike, onDownload, onAddToSoundpad, compact = false }: SearchPageProps) {
  return (
    <div style={{ padding: compact ? '14px 12px 100px' : '24px 24px 100px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
        Поиск: «{query}»
      </h1>
      <div style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>
        {results.length > 0 ? `Найдено ${results.length} результатов` : 'Ничего не найдено — показаны похожие треки'}
      </div>

      {results.length === 0 && allSounds.length > 0 && (
        <>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            Возможно вы искали:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: compact ? '10px' : '14px' }}>
            {allSounds.slice(0, 6).map(s => (
              <SoundCard
                key={s.id}
                sound={s}
                isCurrentlyPlaying={isPlaying}
                isActive={currentSound?.id === s.id}
                currentTime={currentSound?.id === s.id ? currentTime : 0}
                liked={likedIds.has(s.id)}
                onPlay={sound => onPlay(sound, allSounds)}
                onLike={onLike}
                onDownload={onDownload}
                onAddToSoundpad={onAddToSoundpad || (() => {})}
                onComment={() => {}}
                compact={compact}
              />
            ))}
          </div>
        </>
      )}

      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: compact ? '10px' : '14px' }}>
          {results.map(s => (
            <SoundCard
              key={s.id}
              sound={s}
              isCurrentlyPlaying={isPlaying}
              isActive={currentSound?.id === s.id}
              currentTime={currentSound?.id === s.id ? currentTime : 0}
              liked={likedIds.has(s.id)}
              onPlay={sound => onPlay(sound, allSounds)}
              onLike={onLike}
              onDownload={onDownload}
              onAddToSoundpad={onAddToSoundpad || (() => {})}
              onComment={() => {}}
              compact={compact}
            />
          ))}
        </div>
      )}

      {allSounds.length === 0 && (
        <div style={{ textAlign: 'center', color: '#444', padding: '80px 0', fontSize: '15px' }}>
          Нет загруженных звуков. Загрузите первый!
        </div>
      )}
    </div>
  );
}

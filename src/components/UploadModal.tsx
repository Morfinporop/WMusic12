import { useState, useRef, useCallback } from 'react';
import { UploadSoundInput } from '../api';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (payload: UploadSoundInput) => Promise<void> | void;
  availableGenres?: string[];
}

const DEFAULT_GENRES = [
  'none', 'rock', 'pop', 'hip-hop', 'phonk', 'vibe', 'electro', 'meme', 'lofi', 'chill', 'other',
];

export default function UploadModal({ onClose, onUpload, availableGenres = [] }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [genre, setGenre] = useState('none');
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }, [title]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file && !urlInput) return;
    if (!agreed) return;
    setUploading(true);
    let duration = 30;
    if (file) {
      try {
        const tempUrl = URL.createObjectURL(file);
        const audio = new Audio(tempUrl);
        await new Promise<void>((res) => {
          audio.onloadedmetadata = () => {
            duration = audio.duration;
            URL.revokeObjectURL(tempUrl);
            res();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            res();
          };
          setTimeout(() => {
            URL.revokeObjectURL(tempUrl);
            res();
          }, 3000);
        });
      } catch {
        // keep fallback duration
      }
    }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
    try {
      await onUpload({
        title: title.trim() || file?.name?.replace(/\.[^.]+$/, '') || 'Без названия',
        tags: Array.from(new Set([genre !== 'none' ? genre : '', ...tagList].filter(Boolean))),
        genre,
        description: '',
        lyrics: '',
        duration,
        file,
        coverFile,
        urlInput: urlInput.trim() || undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = (file || urlInput.trim()) && agreed && title.trim();

  if (showPolicy || showTerms) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '100%',
          maxHeight: '80vh', overflowY: 'auto',
        }}>
          <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '16px' }}>
            {showPolicy ? 'Политика конфиденциальности' : 'Условия использования'}
          </h2>
          <div style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
            {showPolicy ? (
              <>
                <p><strong style={{ color: '#fff' }}>1. Сбор данных</strong><br />
                WMusic не собирает личные данные пользователей. Все загрузки анонимны.</p><br />
                <p><strong style={{ color: '#fff' }}>2. Хранение</strong><br />
                Аудиофайлы хранятся на серверах платформы. Мы не передаём их третьим лицам.</p><br />
                <p><strong style={{ color: '#fff' }}>3. Cookies</strong><br />
                Мы используем только необходимые технические cookies для работы сайта.</p><br />
                <p><strong style={{ color: '#fff' }}>4. Контент</strong><br />
                Вся модерация контента проходит автоматически с помощью нашей системы фильтрации.</p>
              </>
            ) : (
              <>
                <p><strong style={{ color: '#fff' }}>1. Загружаемый контент</strong><br />
                Загружая звук, вы подтверждаете, что обладаете правами на него или он является свободно распространяемым.</p><br />
                <p><strong style={{ color: '#fff' }}>2. Запрещённый контент</strong><br />
                Категорически запрещено загружать материалы, содержащие насилие, дискриминацию, материалы сексуального характера с участием несовершеннолетних, призывы к незаконным действиям.</p><br />
                <p><strong style={{ color: '#fff' }}>3. Модерация</strong><br />
                Все файлы проходят автоматическую проверку. Неприемлемый контент будет удалён.</p><br />
                <p><strong style={{ color: '#fff' }}>4. Ответственность</strong><br />
                Пользователь несёт полную ответственность за загруженный контент.</p>
              </>
            )}
          </div>
          <button
            onClick={() => { setShowPolicy(false); setShowTerms(false); }}
            className="btn-primary"
            style={{ marginTop: '24px' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        overflowY: 'auto',
        animation: 'fadeIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>Загрузить музыку</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#666',
            padding: '4px', borderRadius: '6px', display: 'flex',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#666'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
            Можно загружать любое количество звуков.
          </div>

          {/* Title */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#ddd', marginBottom: '8px' }}>Название</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 64))}
              placeholder="Название"
              maxLength={64}
            />
            <div style={{ fontSize: '11px', color: '#555', textAlign: 'right', marginTop: '4px' }}>{title.length} / 64</div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#ddd', marginBottom: '8px' }}>Теги</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="раст, громко, смешно"
            />
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Добавить до 5 тегов. Каждый тег до 15 символов.</div>
          </div>

          {/* Genre */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#ddd', marginBottom: '8px' }}>Жанр музыки</label>
            <select value={genre} onChange={e => setGenre(e.target.value)}>
              {[...new Set(['none', ...availableGenres.map(x => x.toLowerCase()), ...DEFAULT_GENRES])].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
              По умолчанию: none. Если выбран жанр, он появится в категориях на главной.
            </div>
          </div>

          {/* File upload */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#ddd', marginBottom: '8px' }}>Загрузить</label>
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '10px',
                padding: '28px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'all 0.2s',
                marginBottom: '10px',
              }}
            >
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {file ? (
                <div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" style={{ marginBottom: '8px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div style={{ color: '#4caf50', fontSize: '14px', fontWeight: '600' }}>{file.name}</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} МБ</div>
                </div>
              ) : (
                <div>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" style={{ marginBottom: '8px' }}>
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  <div style={{ color: '#888', fontSize: '14px', fontWeight: '600' }}>Выберите файл</div>
                  <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>или перетащите сюда</div>
                </div>
              )}
            </div>

            {/* URL import */}
            {!showUrlInput ? (
              <button
                onClick={() => setShowUrlInput(true)}
                style={{
                  width: '100%', padding: '10px', background: '#1a1a1a',
                  border: '1px solid #333', borderRadius: '8px', color: '#ccc',
                  fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#222'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'}
              >
                Импорт из URL
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  style={{ flex: 1 }}
                />
                <button onClick={() => { setUrlInput(''); setShowUrlInput(false); }} className="btn-ghost" style={{ borderRadius: '6px', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                  Отмена
                </button>
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#555', marginTop: '8px', textAlign: 'center' }}>
              Поддерживаются только аудиофайлы<br />
              Поддерживаемые форматы: mp3, wav, ogg, flac<br />
              Максимальный размер файла: 50МБ
            </div>
          </div>

          {/* Cover */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#ddd', marginBottom: '8px' }}>Пользовательская обложка</label>
            <div
              onClick={() => coverRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.12)',
                borderRadius: '10px', padding: '20px',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.border = '2px dashed rgba(255,255,255,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.border = '2px dashed rgba(255,255,255,0.12)'}
            >
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setCoverFile(e.target.files[0]); }} />
              {coverFile ? (
                <span style={{ color: '#4caf50', fontSize: '14px' }}>{coverFile.name}</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#888', fontSize: '14px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Выбрать обложку
                </div>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Добавьте фон к карточке звука (макс. 5МБ).</div>
          </div>

          {/* Agreement */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#fff' }}
              />
              <span style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.5' }}>
                Я согласен с{' '}
                <button onClick={e => { e.preventDefault(); setShowTerms(true); }}
                  style={{ background: 'none', border: 'none', color: '#78b4ff', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: '0' }}>
                  условиями использования
                </button>{' '}и{' '}
                <button onClick={e => { e.preventDefault(); setShowPolicy(true); }}
                  style={{ background: 'none', border: 'none', color: '#78b4ff', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', padding: '0' }}>
                  политикой конфиденциальности
                </button>.
              </span>
            </label>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '8px' }}>
              Загружая, вы подтверждаете, что ваш контент не нарушает авторские права и соответствует нашим правилам сообщества.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || uploading}
              className="btn-primary"
              style={{ minWidth: '120px', opacity: canSubmit && !uploading ? 1 : 0.5 }}
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
            <button onClick={onClose} className="btn-ghost">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsModalProps {
  onClose: () => void;
  lang: 'ru' | 'en';
  quality: 'auto' | 'high' | 'balanced' | 'data';
  crossfade: boolean;
  onQualityChange: (quality: 'auto' | 'high' | 'balanced' | 'data') => void;
  onCrossfadeChange: (enabled: boolean) => void;
  showCovers: boolean;
  onShowCoversChange: (value: boolean) => void;
  coverBlur: number;
  onCoverBlurChange: (value: number) => void;
  preferTranslated: boolean;
  onPreferTranslatedChange: (value: boolean) => void;
  preferPopular: boolean;
  onPreferPopularChange: (value: boolean) => void;
  showVolumeWarning: boolean;
  onShowVolumeWarningChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '100%',
        border: `1px solid ${checked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 14,
        background: checked
          ? 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        color: checked ? '#fff' : '#d3d3d3',
        padding: '13px 14px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
          {description && <div style={{ marginTop: 4, fontSize: 12, color: '#9a9a9a', lineHeight: 1.4 }}>{description}</div>}
        </div>
        <div
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            background: checked ? '#ffffff' : 'rgba(255,255,255,0.2)',
            padding: 2,
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: checked ? '#000' : '#888',
              transform: checked ? 'translateX(18px)' : 'translateX(0)',
              transition: 'all 0.15s ease',
            }}
          />
        </div>
      </div>
    </button>
  );
}

export default function SettingsModal({
  onClose,
  quality,
  crossfade,
  onQualityChange,
  onCrossfadeChange,
  showCovers,
  onShowCoversChange,
  coverBlur,
  onCoverBlurChange,
  preferTranslated,
  onPreferTranslatedChange,
  preferPopular,
  onPreferPopularChange,
  showVolumeWarning,
  onShowVolumeWarningChange,
}: SettingsModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.86)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(180deg, rgba(9,9,9,0.98), rgba(0,0,0,0.98))',
          boxShadow: '0 30px 90px rgba(0,0,0,0.65)',
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Настройки</div>
            <div style={{ marginTop: 4, color: '#8d8d8d', fontSize: 13 }}>Только рабочие параметры воспроизведения и интерфейса</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <section style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Качество звука</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
              {[
                { id: 'auto', label: 'Авто' },
                { id: 'high', label: 'Высокое' },
                { id: 'balanced', label: 'Сбаланс.' },
                { id: 'data', label: 'Экономия' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onQualityChange(item.id as 'auto' | 'high' | 'balanced' | 'data')}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: `1px solid ${quality === item.id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
                    background: quality === item.id
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))'
                      : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <ToggleRow
                label="Плавный переход между треками"
                checked={crossfade}
                onChange={onCrossfadeChange}
              />
            </div>
          </section>

          <section style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Внешний вид</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <ToggleRow
                label="Показывать обложки звуков"
                description="Отображать пользовательские фоновые изображения на карточках звуков."
                checked={showCovers}
                onChange={onShowCoversChange}
              />
              <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Интенсивность размытия обложки</div>
                <div style={{ marginTop: 4, color: '#9a9a9a', fontSize: 12 }}>Управляет эффектом размытия на фоне карточек звуков.</div>
                <input
                  type="range"
                  min={0}
                  max={18}
                  value={coverBlur}
                  onChange={(e) => onCoverBlurChange(Number(e.target.value))}
                  style={{ marginTop: 10, width: '100%' }}
                />
              </div>
            </div>
          </section>

          <section style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Дополнительные параметры</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <ToggleRow
                label="Отдавать предпочтение звукам с переводами"
                checked={preferTranslated}
                onChange={onPreferTranslatedChange}
              />
              <ToggleRow
                label="Отдавать предпочтение популярным звукам независимо от языка"
                checked={preferPopular}
                onChange={onPreferPopularChange}
              />
              <ToggleRow
                label="Показывать предупреждение о громкости"
                checked={showVolumeWarning}
                onChange={onShowVolumeWarningChange}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

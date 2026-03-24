import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUploadClick: () => void;
  onLogoClick: () => void;
  onSettingsClick: () => void;
  onMenuClick: () => void;
  isMobile?: boolean;
  lang?: 'ru' | 'en';
}

export default function Header({
  searchQuery,
  onSearchChange,
  onUploadClick,
  onLogoClick,
  onSettingsClick,
  onMenuClick,
  isMobile = false,
  lang = 'ru',
}: HeaderProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header style={{
      minHeight: isMobile ? '58px' : '52px',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '8px 10px' : '0 16px',
      gap: '12px',
      zIndex: 100,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
    }}>
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label="Open menu"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Logo */}
      <div
        onClick={onLogoClick}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
      >
        <img
          src="https://img.freepik.com/premium-vector/letter-w-icon-logo_38694-10.jpg"
          alt="WMusic"
          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
        />
        {!isMobile && <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>WMusic</span>}
      </div>

      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: isMobile ? 'none' : '380px',
        margin: isMobile ? '0' : '0 auto',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: focused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '8px',
          padding: '0 12px',
          gap: '8px',
          transition: 'all 0.2s',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={lang === 'ru' ? 'Поиск' : 'Search'}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '14px',
              width: '100%',
              padding: '8px 0',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '0', display: 'flex' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {!isMobile && <div style={{ flex: 1 }} />}

      {/* Upload Button */}
      <button
        onClick={onUploadClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '13.5px',
          fontWeight: '600',
          padding: isMobile ? '8px 10px' : '8px 16px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        {!isMobile && (lang === 'ru' ? 'Загрузить музыку' : 'Upload music')}
      </button>

      {/* Settings */}
      <button
        onClick={onSettingsClick}
        style={{
          width: isMobile ? '38px' : '36px', height: isMobile ? '38px' : '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#aaa',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = '#aaa';
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </header>
  );
}

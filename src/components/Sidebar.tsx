import { Page, Playlist, Sound } from '../types';
import { localizeTitle } from '../utils/text';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  recentSounds: Sound[];
  recentPlaylists: Playlist[];
  onPlayRecent: (sound: Sound) => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  lang?: 'ru' | 'en';
}

interface NavItem { id: Page; label: string; icon: React.ReactNode; badge?: string; }
const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Свежее',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'music',
    label: 'Музыка',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    badge: 'BETA',
  },
  {
    id: 'favorites',
    label: 'Избранные',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
];

const bottomItems = [
  {
    id: 'request_sound' as Page,
    label: 'Запросить звук',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'rights' as Page,
    label: 'Защита прав',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'telegram' as Page,
    label: 'Telegram',
    icon: <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCodCp-cYwcl3YZM49XsRf7VAmUnvJ_y21NQ&s" alt="telegram" style={{ width: 17, height: 17, borderRadius: '50%' }} />,
  },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  recentSounds,
  recentPlaylists,
  onPlayRecent,
  onOpenPlaylist,
  isMobile = false,
  mobileOpen = false,
  onCloseMobile,
  lang = 'ru',
}: SidebarProps) {
  if (isMobile && !mobileOpen) return null;

  return (
    <>
      {isMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.56)',
            zIndex: 140,
          }}
        />
      )}
      <aside style={{
        width: isMobile ? '84vw' : '248px',
        maxWidth: isMobile ? '320px' : 'none',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: isMobile ? '10px 10px 18px' : '12px 12px 18px',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: isMobile ? 150 : 'auto',
        boxShadow: isMobile ? '20px 0 60px rgba(0,0,0,0.55)' : 'none',
      }}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 6px 8px' }}>
            <button
              onClick={onCloseMobile}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ccc',
              }}
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#5d5d5d', letterSpacing: '0.9px', padding: '10px 14px 8px', textTransform: 'uppercase' }}>
        {lang === 'ru' ? 'Главная' : 'Main'}
      </div>

      {navItems.map(item => (
        <div
          key={item.id}
          className={`nav-item${currentPage === item.id ? ' active' : ''}`}
          onClick={() => {
            onNavigate(item.id);
            onCloseMobile?.();
          }}
          style={{
            marginBottom: 8,
            borderRadius: 14,
            minHeight: 56,
            background: currentPage === item.id
              ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(232,232,232,0.96))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            border: currentPage === item.id ? '1px solid rgba(255,255,255,0.98)' : '1px solid rgba(255,255,255,0.12)',
            color: currentPage === item.id ? '#050505' : '#e7e7e7',
            boxShadow: currentPage === item.id
              ? '0 7px 24px rgba(255,255,255,0.12)'
              : '0 8px 18px rgba(0,0,0,0.26)',
          }}
        >
          <span style={{ opacity: currentPage === item.id ? 1 : 0.82, flexShrink: 0 }}>{item.icon}</span>
          <span style={{ fontSize: 16, fontWeight: currentPage === item.id ? 700 : 600 }}>{item.label}</span>
          {item.badge && (
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              background: currentPage === item.id
                ? 'linear-gradient(180deg, #ff5b5b, #d71919)'
                : 'linear-gradient(180deg, #ff4040, #870606)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), 0 4px 10px rgba(255,20,20,0.35)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: '999px',
              marginLeft: 'auto',
            }}>
              {item.badge}
            </span>
          )}
        </div>
      ))}

      {(recentSounds.length > 0 || recentPlaylists.length > 0) && (
        <>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 4px' }} />
          {recentSounds.length > 0 && (
            <div style={{ padding: '0 10px 8px' }}>
               <div style={{ fontSize: '10px', color: '#737373', textTransform: 'uppercase', marginBottom: '7px', letterSpacing: '0.8px' }}>Недавно слушали</div>
              {recentSounds.slice(0, 3).map(sound => (
                <button
                  key={sound.id}
                  onClick={() => {
                    onPlayRecent(sound);
                    onCloseMobile?.();
                  }}
                  style={{ width: '100%', textAlign: 'left', marginBottom: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#d7d7d7', padding: '9px 10px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}
                >
                  {localizeTitle(sound.title, lang)}
                </button>
              ))}
            </div>
          )}
          {recentPlaylists.length > 0 && (
            <div style={{ padding: '0 10px 4px' }}>
               <div style={{ fontSize: '10px', color: '#737373', textTransform: 'uppercase', marginBottom: '7px', letterSpacing: '0.8px' }}>Топ плейлисты</div>
              {recentPlaylists.slice(0, 3).map(playlist => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onOpenPlaylist(playlist);
                    onCloseMobile?.();
                  }}
                  style={{ width: '100%', textAlign: 'left', marginBottom: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#d7d7d7', padding: '9px 10px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px' }}
                >
                  {playlist.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 4px' }} />

      {bottomItems.map(item => (
        <div
          key={item.id}
          className={`nav-item${currentPage === item.id ? ' active' : ''}`}
          onClick={() => {
            if (item.id === 'telegram' || item.id === 'request_sound') {
              window.open('https://t.me/WMusic67', '_blank');
              return;
            }
            onNavigate(item.id);
            onCloseMobile?.();
          }}
          style={{
            position: 'relative',
            marginBottom: 8,
            borderRadius: 12,
            minHeight: 48,
            background: currentPage === item.id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ opacity: 0.75, flexShrink: 0 }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
      </aside>
    </>
  );
}

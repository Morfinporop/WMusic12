import { Page } from '../types';

interface MobileTabBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

type TabItem = {
  id: Page;
  label: string;
  icon: React.ReactNode;
};

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Свежее',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    id: 'music',
    label: 'Музыка',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'favorites',
    label: 'Избранные',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export default function MobileTabBar({ currentPage, onNavigate }: MobileTabBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 10,
        right: 10,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        height: 64,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
        zIndex: 115,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: 6,
        gap: 6,
      }}
    >
      {tabs.map((tab) => {
        const active = currentPage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              border: active ? '1px solid rgba(255,255,255,0.26)' : '1px solid transparent',
              background: active ? 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))' : 'transparent',
              borderRadius: 12,
              color: active ? '#fff' : '#9b9b9b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.2,
              cursor: 'pointer',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
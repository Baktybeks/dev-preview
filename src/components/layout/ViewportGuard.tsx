import React, { useState, useEffect } from 'react';

const DESKTOP_MIN_WIDTH_PX = 1025;

const wrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  backgroundColor: '#0f172a',
  color: '#e2e8f0',
  textAlign: 'center',
  boxSizing: 'border-box',
};

const iconStyle: React.CSSProperties = {
  fontSize: '64px',
  marginBottom: '24px',
  opacity: 0.8,
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  marginBottom: '12px',
};

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#94a3b8',
  lineHeight: 1.5,
  maxWidth: '360px',
};

type ViewportGuardProps = {
  children: React.ReactNode;
};

export const ViewportGuard: React.FC<ViewportGuardProps> = ({ children }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  if (isDesktop) {
    return (
      <div style={wrapperStyle}>
        <div style={iconStyle} aria-hidden>📱</div>
        <h1 style={titleStyle}>Только мобильные и планшеты</h1>
        <p style={textStyle}>
          FrontPrep предназначен для экранов телефонов и планшетов. Откройте приложение на мобильном устройстве или уменьшите ширину окна браузера.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

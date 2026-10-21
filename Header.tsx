import type { FC } from 'react';
import { Sparkles, RotateCw, Grid } from 'lucide-react';
import { AppMode } from '../../types/atmosphere';

interface HeaderProps {
  appMode: AppMode;
  autoRotate: boolean;
  gridVisible: boolean;
  onToggleAutoRotate: () => void;
  onToggleGrid: () => void;
}

export const Header: FC<HeaderProps> = ({
  appMode,
  autoRotate,
  gridVisible,
  onToggleAutoRotate,
  onToggleGrid,
}) => {
  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(6, 8, 13, 0.85) 0%, rgba(6, 8, 13, 0) 100%)',
      }}
    >
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', pointerEvents: 'auto' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(37, 99, 235, 0.3) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            boxShadow: '0 0 16px rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={22} color="#f5e4a8" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              className="gold-gradient-text"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                lineHeight: 1.1,
              }}
            >
              ATMOSPHERE AR
            </h1>
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(203, 213, 225, 0.25)',
                color: 'var(--color-silver-muted)',
                background: 'rgba(15, 23, 42, 0.6)',
              }}
            >
              v1.0 Foundations
            </span>
          </div>
          <p
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              color: 'var(--color-silver-muted)',
              marginTop: '3px',
              textTransform: 'uppercase',
            }}
          >
            Hookah Lounge Edition • Precision 3D Engine
          </p>
        </div>
      </div>

      {/* Mode pill & quick toggles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto',
        }}
      >
        {/* Mode Tag */}
        <div
          className="glass-panel"
          style={{
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            border:
              appMode === 'live_ar'
                ? '1px solid rgba(37, 99, 235, 0.6)'
                : appMode === 'demo'
                ? '1px solid rgba(212, 175, 55, 0.6)'
                : '1px solid rgba(148, 163, 184, 0.3)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                appMode === 'live_ar'
                  ? '#3b82f6'
                  : appMode === 'demo'
                  ? '#eab308'
                  : '#94a3b8',
              boxShadow:
                appMode === 'live_ar'
                  ? '0 0 10px #3b82f6'
                  : appMode === 'demo'
                  ? '0 0 10px #eab308'
                  : 'none',
            }}
          />
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>
            {appMode === 'live_ar'
              ? 'Live AR Active'
              : appMode === 'demo'
              ? 'Demo Studio'
              : 'Standby View'}
          </span>
        </div>

        {/* Orbit Auto-spin toggle */}
        <button
          onClick={onToggleAutoRotate}
          title={autoRotate ? 'Pause Turntable' : 'Resume Turntable'}
          className="silver-subtle-btn"
          style={{
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
          }}
        >
          <RotateCw size={14} color={autoRotate ? '#d4af37' : '#94a3b8'} />
          <span>{autoRotate ? 'Spinning' : 'Paused'}</span>
        </button>

        {/* AR Grid Toggle */}
        <button
          onClick={onToggleGrid}
          title="Toggle AR Ground Reticle Grid"
          className="silver-subtle-btn"
          style={{
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
          }}
        >
          <Grid size={14} color={gridVisible ? '#60a5fa' : '#94a3b8'} />
          <span>{gridVisible ? 'Grid On' : 'Grid Off'}</span>
        </button>
      </div>
    </header>
  );
};

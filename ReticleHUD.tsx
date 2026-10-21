import type { FC } from 'react';
import { AppMode } from '../../types/atmosphere';

interface ReticleHUDProps {
  appMode: AppMode;
}

export const ReticleHUD: FC<ReticleHUDProps> = ({ appMode }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
      }}
    >
      {/* Outer Viewport Corner Markers */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '24px',
          height: '24px',
          borderTop: '2px solid rgba(212, 175, 55, 0.65)',
          borderLeft: '2px solid rgba(212, 175, 55, 0.65)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '24px',
          height: '24px',
          borderTop: '2px solid rgba(212, 175, 55, 0.65)',
          borderRight: '2px solid rgba(212, 175, 55, 0.65)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '24px',
          height: '24px',
          borderBottom: '2px solid rgba(212, 175, 55, 0.65)',
          borderLeft: '2px solid rgba(212, 175, 55, 0.65)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '24px',
          height: '24px',
          borderBottom: '2px solid rgba(212, 175, 55, 0.65)',
          borderRight: '2px solid rgba(212, 175, 55, 0.65)',
        }}
      />

      {/* Central Viewfinder Reticle (Active in Live AR and Demo) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '1px dashed rgba(37, 99, 235, 0.35)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="animate-pulse-ring"
      >
        {/* Inner Reticle Ring */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        />

        {/* Crosshair horizontal tick */}
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '1px',
            backgroundColor: 'rgba(226, 232, 240, 0.4)',
            left: '20px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '1px',
            backgroundColor: 'rgba(226, 232, 240, 0.4)',
            right: '20px',
          }}
        />

        {/* Crosshair vertical tick */}
        <div
          style={{
            position: 'absolute',
            height: '20px',
            width: '1px',
            backgroundColor: 'rgba(226, 232, 240, 0.4)',
            top: '20px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '20px',
            width: '1px',
            backgroundColor: 'rgba(226, 232, 240, 0.4)',
            bottom: '20px',
          }}
        />
      </div>

      {/* Right HUD Telemetry Column */}
      <div
        style={{
          position: 'absolute',
          right: '24px',
          top: '90px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--color-silver-muted)',
          letterSpacing: '0.05em',
        }}
      >
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-gold-brass)' }}>SYS_TARGET: </span>
          <span>ROYAL_HOOKAH_01</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-cobalt-light)' }}>LIGHT_ENG: </span>
          <span>ACES_FILMIC_HDR</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-silver)' }}>PBR_SHADERS: </span>
          <span>PHYSICAL + STD</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: appMode === 'live_ar' ? '#3b82f6' : '#d4af37' }}>FEED_MODE: </span>
          <span>{appMode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

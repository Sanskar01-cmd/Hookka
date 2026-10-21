import type { FC } from 'react';
import { HandTrackingTelemetry } from '../../types/atmosphere';

interface HandTrackingOverlayProps {
  telemetry: HandTrackingTelemetry;
  isTrackingActive: boolean;
}

export const HandTrackingOverlay: FC<HandTrackingOverlayProps> = ({
  telemetry,
  isTrackingActive,
}) => {
  if (!isTrackingActive || telemetry.state === 'disabled' || telemetry.state === 'loading_model') {
    return null;
  }

  const { screenX, screenY, isPinching, isDragging, state } = telemetry;
  const isHandVisible = state !== 'searching';

  if (!isHandVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {/* Dynamic Hand Reticle */}
      <div
        style={{
          position: 'absolute',
          left: `${screenX * 100}%`,
          top: `${screenY * 100}%`,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.05s ease-out',
        }}
      >
        {/* Reticle Ring */}
        <div
          style={{
            width: isPinching ? '32px' : '48px',
            height: isPinching ? '32px' : '48px',
            borderRadius: '50%',
            border: isDragging
              ? '2px solid #f5e4a8'
              : isPinching
              ? '2px solid #d4af37'
              : '2px dashed rgba(96, 165, 250, 0.75)',
            boxShadow: isDragging
              ? '0 0 20px #d4af37, inset 0 0 10px #d4af37'
              : isPinching
              ? '0 0 16px rgba(212, 175, 55, 0.8)'
              : '0 0 12px rgba(37, 99, 235, 0.4)',
            backgroundColor: isDragging
              ? 'rgba(212, 175, 55, 0.25)'
              : isPinching
              ? 'rgba(212, 175, 55, 0.15)'
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Inner Center Dot */}
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isDragging ? '#ffffff' : isPinching ? '#f5e4a8' : '#60a5fa',
            }}
          />
        </div>

        {/* State Tag */}
        <div
          style={{
            marginTop: '8px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(6, 9, 15, 0.85)',
            border: `1px solid ${isDragging ? '#d4af37' : isPinching ? '#eab308' : 'rgba(96, 165, 250, 0.5)'}`,
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: isDragging ? '#fef08a' : isPinching ? '#fde047' : '#93c5fd',
            whiteSpace: 'nowrap',
          }}
        >
          {isDragging
            ? 'MOUTHPIECE GRABBED'
            : isPinching
            ? 'PINCH DETECTED'
            : 'HAND DETECTED'}
        </div>
      </div>
    </div>
  );
};

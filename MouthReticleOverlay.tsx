import type { FC } from 'react';
import { FaceTrackingTelemetry } from '../../types/atmosphere';

interface MouthReticleOverlayProps {
  telemetry: FaceTrackingTelemetry;
  isTrackingActive: boolean;
}

export const MouthReticleOverlay: FC<MouthReticleOverlayProps> = ({
  telemetry,
  isTrackingActive,
}) => {
  if (!isTrackingActive || telemetry.state !== 'face_detected') {
    return null;
  }

  const { mouthScreenX, mouthScreenY, isMouthOpen, isNearMouthpiece, isExhalingSmoke } = telemetry;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 14,
      }}
    >
      {/* Lip Target Reticle */}
      <div
        style={{
          position: 'absolute',
          left: `${mouthScreenX * 100}%`,
          top: `${mouthScreenY * 100}%`,
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
            width: isExhalingSmoke ? '36px' : isNearMouthpiece ? '28px' : '20px',
            height: isExhalingSmoke ? '36px' : isNearMouthpiece ? '28px' : '20px',
            borderRadius: '50%',
            border: isExhalingSmoke
              ? '2px solid #ffffff'
              : isNearMouthpiece
              ? '1.5px solid #60a5fa'
              : '1px dashed rgba(203, 213, 225, 0.4)',
            boxShadow: isExhalingSmoke
              ? '0 0 25px rgba(255, 255, 255, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.6)'
              : isNearMouthpiece
              ? '0 0 16px rgba(96, 165, 250, 0.6)'
              : 'none',
            backgroundColor: isExhalingSmoke
              ? 'rgba(255, 255, 255, 0.2)'
              : isNearMouthpiece
              ? 'rgba(37, 99, 235, 0.15)'
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease-out',
          }}
        >
          {/* Center Point */}
          <div
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: isExhalingSmoke ? '#ffffff' : '#93c5fd',
            }}
          />
        </div>

        {/* Status Tag */}
        {(isNearMouthpiece || isExhalingSmoke) && (
          <div
            style={{
              marginTop: '6px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(6, 9, 15, 0.88)',
              border: `1px solid ${isExhalingSmoke ? '#ffffff' : '#3b82f6'}`,
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isExhalingSmoke ? '#ffffff' : isMouthOpen ? '#93c5fd' : '#f5e4a8',
              whiteSpace: 'nowrap',
              boxShadow: isExhalingSmoke ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none',
            }}
          >
            {isExhalingSmoke
              ? '💨 EXHALING SMOKE'
              : isNearMouthpiece && !isMouthOpen
              ? 'OPEN MOUTH TO EXHALE'
              : 'LIPS ALIGNED'}
          </div>
        )}
      </div>
    </div>
  );
};

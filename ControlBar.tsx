import type { FC } from 'react';
import { Hand, PlayCircle, RotateCcw, VideoOff, Maximize2, Sparkles } from 'lucide-react';
import { AppMode } from '../../types/atmosphere';

interface ControlBarProps {
  appMode: AppMode;
  isTrackingActive: boolean;
  onStartHandTracking: () => void;
  onStopHandTracking: () => void;
  onActivateDemo: () => void;
  onResetView: () => void;
  onResetMouthpiece?: () => void;
}

export const ControlBar: FC<ControlBarProps> = ({
  appMode,
  isTrackingActive,
  onStartHandTracking,
  onStopHandTracking,
  onActivateDemo,
  onResetView,
  onResetMouthpiece,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '16px',
        }}
      >
        {/* Corner Brackets */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Start / Stop Hand Tracking CTA */}
        {!isTrackingActive ? (
          <button
            onClick={onStartHandTracking}
            className="gold-glow-btn"
            style={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.86rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Hand size={18} fill="#fffbeb" />
            <span>Start Hand Tracking</span>
          </button>
        ) : (
          <button
            onClick={onStopHandTracking}
            className="silver-subtle-btn"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          >
            <VideoOff size={16} />
            <span>Stop Hand Tracking</span>
          </button>
        )}

        {/* Reset Mouthpiece Position if active */}
        {isTrackingActive && onResetMouthpiece && (
          <button
            onClick={onResetMouthpiece}
            title="Reset Mouthpiece to Hookah Stand"
            className="silver-subtle-btn"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
            }}
          >
            <Sparkles size={16} color="#f5e4a8" />
            <span>Dock Mouthpiece</span>
          </button>
        )}

        {/* Demo Mode Button */}
        <button
          onClick={onActivateDemo}
          className={appMode === 'demo' ? 'cobalt-glow-btn' : 'silver-subtle-btn'}
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          <PlayCircle size={16} color={appMode === 'demo' ? '#93c5fd' : '#cbd5e1'} />
          <span>Demo Mode</span>
        </button>

        {/* Reset Camera Angle */}
        <button
          onClick={onResetView}
          title="Reset Camera Angle & Distance"
          className="silver-subtle-btn"
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.84rem',
          }}
        >
          <RotateCcw size={16} />
          <span>Reset View</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="silver-subtle-btn"
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};

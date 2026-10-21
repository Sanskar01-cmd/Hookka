import { useState, type FC } from 'react';
import { Camera, Activity, Monitor, ShieldAlert, Cpu, ChevronDown, ChevronUp, VideoOff, PlayCircle, Hand, Sparkles, Smile, Wind } from 'lucide-react';
import { CameraMetrics, HandTrackingTelemetry, FaceTrackingTelemetry } from '../../types/atmosphere';

interface CameraStatusPanelProps {
  metrics: CameraMetrics;
  sceneFps: number;
  handTelemetry?: HandTrackingTelemetry;
  faceTelemetry?: FaceTrackingTelemetry;
  isTrackingActive?: boolean;
  onStopCamera?: () => void;
  onActivateDemo?: () => void;
  onResetMouthpiece?: () => void;
}

export const CameraStatusPanel: FC<CameraStatusPanelProps> = ({
  metrics,
  sceneFps,
  handTelemetry,
  faceTelemetry,
  isTrackingActive = false,
  onStopCamera,
  onActivateDemo,
  onResetMouthpiece,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const getStatusColor = () => {
    switch (metrics.status) {
      case 'active':
        return '#3b82f6';
      case 'demo':
        return '#eab308';
      case 'requesting':
        return '#60a5fa';
      case 'denied':
      case 'error':
        return '#ef4444';
      case 'idle':
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = () => {
    switch (metrics.status) {
      case 'active':
        return isTrackingActive ? 'LIVE AR + HAND & FACE TRACK' : 'LIVE OPTICAL FEED (MIRRORED)';
      case 'demo':
        return 'DEMO MODE (SYNTHETIC)';
      case 'requesting':
        return 'REQUESTING ACCESS...';
      case 'denied':
        return 'ACCESS DENIED';
      case 'error':
        return 'SENSOR ERROR';
      case 'idle':
      default:
        return 'STANDBY / READY';
    }
  };

  const getHandStateColor = () => {
    if (!handTelemetry) return '#94a3b8';
    switch (handTelemetry.state) {
      case 'dragging':
        return '#f5e4a8';
      case 'pinching':
        return '#d4af37';
      case 'hand_detected':
        return '#60a5fa';
      case 'searching':
        return '#38bdf8';
      case 'loading_model':
        return '#eab308';
      case 'error':
        return '#ef4444';
      case 'disabled':
      default:
        return '#94a3b8';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '84px',
        left: '24px',
        width: '340px',
        zIndex: 20,
        padding: '16px 18px',
        pointerEvents: 'auto',
      }}
    >
      {/* Corner Brackets */}
      <div className="corner-bracket-tl" />
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />
      <div className="corner-bracket-br" />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={16} color="var(--color-gold-brass)" />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-silver)',
            }}
          >
            Vision & Sensor Telemetry
          </span>
        </div>

        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-silver-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Live Badge */}
      <div
        style={{
          marginTop: '10px',
          padding: '7px 10px',
          borderRadius: '6px',
          background: 'rgba(6, 9, 15, 0.65)',
          border: `1px solid ${getStatusColor()}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              boxShadow: `0 0 10px ${getStatusColor()}`,
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: getStatusColor(),
            }}
          >
            {getStatusLabel()}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-silver-muted)',
          }}
        >
          {metrics.status === 'active' || metrics.status === 'demo' ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Collapsible Details */}
      {!collapsed && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Resolution & FPS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-silver-muted)' }}>
              <Monitor size={14} />
              <span>Resolution:</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-silver)', fontWeight: 600 }}>
              {metrics.resolution
                ? `${metrics.resolution.width} × ${metrics.resolution.height}`
                : '1920 × 1080 (Target)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-silver-muted)' }}>
              <Activity size={14} color="#60a5fa" />
              <span>Rendering Engine:</span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: sceneFps > 45 ? '#4ade80' : sceneFps > 25 ? '#facc15' : '#f87171',
                fontWeight: 600,
              }}
            >
              {sceneFps} FPS
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-silver-muted)' }}>
              <Cpu size={14} />
              <span>Optical Sensor:</span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--color-silver)',
                maxWidth: '150px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'right',
              }}
              title={metrics.deviceName}
            >
              {metrics.deviceName}
            </span>
          </div>

          {/* Hand Tracking Telemetry */}
          {isTrackingActive && handTelemetry && (
            <div
              style={{
                marginTop: '4px',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(10, 16, 28, 0.75)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#93c5fd' }}>
                  <Hand size={14} />
                  <span style={{ fontWeight: 600 }}>Hand Tracking</span>
                </div>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: getHandStateColor(),
                    textTransform: 'uppercase',
                  }}
                >
                  {handTelemetry.state.replace('_', ' ')}
                </span>
              </div>

              {/* Pinch Distance Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--color-silver-muted)', marginBottom: '3px' }}>
                  <span>Pinch Distance:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {handTelemetry.state === 'searching' ? 'No Hand' : `${Math.round(handTelemetry.pinchDistance * 100)}%`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (1 - handTelemetry.pinchDistance) * 100)}%`,
                      backgroundColor: handTelemetry.isDragging ? '#f5e4a8' : handTelemetry.isPinching ? '#d4af37' : '#3b82f6',
                      transition: 'width 0.08s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Face & Smoke Telemetry */}
          {isTrackingActive && faceTelemetry && (
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(12, 18, 32, 0.75)',
                border: faceTelemetry.isExhalingSmoke
                  ? '1px solid rgba(255, 255, 255, 0.6)'
                  : '1px solid rgba(148, 163, 184, 0.25)',
                boxShadow: faceTelemetry.isExhalingSmoke ? '0 0 16px rgba(255, 255, 255, 0.2)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#cbd5e1' }}>
                  <Smile size={14} color="#60a5fa" />
                  <span style={{ fontWeight: 600 }}>Face & Lip Detection</span>
                </div>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: faceTelemetry.state === 'face_detected' ? '#4ade80' : '#facc15',
                    textTransform: 'uppercase',
                  }}
                >
                  {faceTelemetry.state.replace('_', ' ')}
                </span>
              </div>

              {/* Mouth Openness Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--color-silver-muted)', marginBottom: '3px' }}>
                  <span>Mouth Openness:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: faceTelemetry.isMouthOpen ? '#f5e4a8' : '#94a3b8' }}>
                    {Math.round(faceTelemetry.mouthOpenness * 100)}% {faceTelemetry.isMouthOpen ? '(OPEN)' : ''}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, faceTelemetry.mouthOpenness * 100)}%`,
                      backgroundColor: faceTelemetry.isMouthOpen ? '#f5e4a8' : '#3b82f6',
                      transition: 'width 0.08s ease',
                    }}
                  />
                </div>
              </div>

              {/* Proximity & Smoke Exhale Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                <span style={{ color: 'var(--color-silver-muted)' }}>Mouthpiece at Lips:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: faceTelemetry.isNearMouthpiece ? '#4ade80' : '#94a3b8',
                  }}
                >
                  {faceTelemetry.isNearMouthpiece ? 'YES (ALIGNED)' : 'NO (AWAY)'}
                </span>
              </div>

              {faceTelemetry.isExhalingSmoke && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '4px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  <Wind size={14} className="animate-pulse-subtle" />
                  <span>EXHALING 3D SMOKE</span>
                </div>
              )}

              {onResetMouthpiece && (
                <button
                  onClick={onResetMouthpiece}
                  className="silver-subtle-btn"
                  style={{
                    marginTop: '2px',
                    padding: '5px 10px',
                    fontSize: '0.68rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={12} color="#f5e4a8" />
                  <span>Reset Mouthpiece to Stand</span>
                </button>
              )}
            </div>
          )}

          {/* Error alert if any */}
          {metrics.errorMessage && (
            <div
              style={{
                marginTop: '4px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '0.7rem',
                color: '#fca5a5',
              }}
            >
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 600 }}>Optical Sensor Offline</p>
                <p style={{ opacity: 0.85, fontSize: '0.66rem', marginTop: '2px', lineHeight: 1.35 }}>
                  {metrics.errorMessage}
                </p>
                {onActivateDemo && (
                  <button
                    onClick={onActivateDemo}
                    style={{
                      marginTop: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold-light)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.68rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <PlayCircle size={12} />
                    <span>Switch to Demo Mode</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stop Tracking Button */}
          {metrics.status === 'active' && onStopCamera && (
            <button
              onClick={onStopCamera}
              className="silver-subtle-btn"
              style={{
                marginTop: '6px',
                padding: '8px 12px',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.35)',
              }}
            >
              <VideoOff size={14} />
              <span>Stop Camera & Vision AI</span>
            </button>
          )}

          {/* Quick HUD Hint */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.68rem',
              color: 'var(--color-silver-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Pinch: Grab Mouthpiece</span>
            <span>Lips: Open to Smoke</span>
          </div>
        </div>
      )}
    </div>
  );
};

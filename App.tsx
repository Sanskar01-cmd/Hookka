import { useState, useRef, useCallback, useEffect } from 'react';
import { SceneContainer, SceneContainerRef } from './components/Scene/SceneContainer';
import { Header } from './components/UI/Header';
import { CameraStatusPanel } from './components/UI/CameraStatusPanel';
import { ControlBar } from './components/UI/ControlBar';
import { ReticleHUD } from './components/UI/ReticleHUD';
import { HandTrackingOverlay } from './components/UI/HandTrackingOverlay';
import { MouthReticleOverlay } from './components/UI/MouthReticleOverlay';
import { useCameraStream } from './hooks/useCameraStream';
import { HandTrackingService } from './services/HandTrackingService';
import { FaceTrackingService } from './services/FaceTrackingService';
import { AppMode, HandTrackingTelemetry, FaceTrackingTelemetry } from './types/atmosphere';
import { Loader2, ShieldAlert, PlayCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [appMode, setAppMode] = useState<AppMode>('standby');
  const [sceneFps, setSceneFps] = useState<number>(60);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [gridVisible, setGridVisible] = useState<boolean>(true);

  // Hand tracking telemetry state
  const [handTelemetry, setHandTelemetry] = useState<HandTrackingTelemetry>({
    state: 'disabled',
    pinchDistance: 1,
    isPinching: false,
    isDragging: false,
    screenX: 0.5,
    screenY: 0.5,
    ndcX: 0,
    ndcY: 0,
    errorMessage: null,
  });

  // Face & mouth tracking telemetry state
  const [faceTelemetry, setFaceTelemetry] = useState<FaceTrackingTelemetry>({
    state: 'disabled',
    mouthScreenX: 0.5,
    mouthScreenY: 0.5,
    mouthNdcX: 0,
    mouthNdcY: 0,
    mouthOpenness: 0,
    isMouthOpen: false,
    isNearMouthpiece: false,
    isExhalingSmoke: false,
    errorMessage: null,
  });

  const [isVisionInitializing, setIsVisionInitializing] = useState(false);

  const sceneRef = useRef<SceneContainerRef | null>(null);
  const handServiceRef = useRef<HandTrackingService | null>(null);
  const faceServiceRef = useRef<FaceTrackingService | null>(null);
  const { metrics, videoRef, startCamera, activateDemoMode, stopStream } = useCameraStream();

  // Instantiate vision services on mount
  useEffect(() => {
    const handService = new HandTrackingService();
    const faceService = new FaceTrackingService();
    handServiceRef.current = handService;
    faceServiceRef.current = faceService;

    return () => {
      handService.dispose();
      faceService.dispose();
      handServiceRef.current = null;
      faceServiceRef.current = null;
    };
  }, []);

  // Frame hand telemetry handler
  const handleHandTelemetryUpdate = useCallback((telemetry: HandTrackingTelemetry) => {
    setHandTelemetry(telemetry);

    if (!sceneRef.current) return;

    if (telemetry.isPinching) {
      const isNear = sceneRef.current.isNearMouthpiece(telemetry.ndcX, telemetry.ndcY, 0.45);
      if (isNear || telemetry.isDragging) {
        handServiceRef.current?.setDragging(true);
        sceneRef.current.updateHandDrag(telemetry.ndcX, telemetry.ndcY);
      }
    } else {
      if (telemetry.isDragging) {
        handServiceRef.current?.setDragging(false);
      }
      sceneRef.current.releaseHandDrag();
    }
  }, []);

  // Frame face telemetry handler & smoke trigger logic
  const handleFaceTelemetryUpdate = useCallback((rawFaceData: FaceTrackingTelemetry) => {
    if (!sceneRef.current) {
      setFaceTelemetry(rawFaceData);
      return;
    }

    // Query 2D screen coordinates of the moving virtual mouthpiece
    const mouthpieceScreen = sceneRef.current.getMouthpieceScreenCoords();

    // Distance between user's lips and mouthpiece
    const distToMouth = Math.hypot(
      rawFaceData.mouthScreenX - mouthpieceScreen.x,
      rawFaceData.mouthScreenY - mouthpieceScreen.y
    );

    // Lip proximity check (with threshold)
    const isNearLips = rawFaceData.state === 'face_detected' && distToMouth < 0.22;

    // Trigger smoke ONLY when mouthpiece is near lips AND mouth is open
    const isExhalingSmoke = isNearLips && rawFaceData.isMouthOpen;

    // Direct smoke particle engine in Three.js
    sceneRef.current.setSmokeActive(isExhalingSmoke, rawFaceData.mouthNdcX, rawFaceData.mouthNdcY);

    setFaceTelemetry({
      ...rawFaceData,
      isNearMouthpiece: isNearLips,
      isExhalingSmoke,
    });
  }, []);

  // Start Vision AI workflow (Webcam + Hand + Face Tracking)
  const handleStartTracking = useCallback(async () => {
    setIsVisionInitializing(true);
    setAppMode('live_ar');

    try {
      // 1. Request camera
      await startCamera();

      // 2. Initialize MediaPipe Hand & Face vision models concurrently
      setHandTelemetry((prev) => ({ ...prev, state: 'loading_model' }));
      setFaceTelemetry((prev) => ({ ...prev, state: 'loading_model' }));

      if (handServiceRef.current && faceServiceRef.current) {
        await Promise.all([
          handServiceRef.current.initialize(),
          faceServiceRef.current.initialize(),
        ]);

        if (videoRef.current) {
          handServiceRef.current.start(videoRef.current, handleHandTelemetryUpdate);
          faceServiceRef.current.start(videoRef.current, handleFaceTelemetryUpdate);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start vision tracker';
      setHandTelemetry((prev) => ({ ...prev, state: 'error', errorMessage: msg }));
      setFaceTelemetry((prev) => ({ ...prev, state: 'error', errorMessage: msg }));
    } finally {
      setIsVisionInitializing(false);
    }
  }, [startCamera, handleHandTelemetryUpdate, handleFaceTelemetryUpdate, videoRef]);

  // Stop Vision AI and release camera tracks
  const handleStopTracking = useCallback(() => {
    handServiceRef.current?.stop();
    faceServiceRef.current?.stop();
    stopStream();
    sceneRef.current?.releaseHandDrag();
    sceneRef.current?.setSmokeActive(false);

    setAppMode('standby');
    setHandTelemetry({
      state: 'disabled',
      pinchDistance: 1,
      isPinching: false,
      isDragging: false,
      screenX: 0.5,
      screenY: 0.5,
      ndcX: 0,
      ndcY: 0,
      errorMessage: null,
    });
    setFaceTelemetry({
      state: 'disabled',
      mouthScreenX: 0.5,
      mouthScreenY: 0.5,
      mouthNdcX: 0,
      mouthNdcY: 0,
      mouthOpenness: 0,
      isMouthOpen: false,
      isNearMouthpiece: false,
      isExhalingSmoke: false,
      errorMessage: null,
    });
  }, [stopStream]);

  // Activate Demo Mode (stops webcam completely)
  const handleActivateDemo = useCallback(() => {
    handServiceRef.current?.stop();
    faceServiceRef.current?.stop();
    stopStream();
    sceneRef.current?.releaseHandDrag();
    sceneRef.current?.setSmokeActive(false);

    setAppMode('demo');
    activateDemoMode();
    setHandTelemetry({
      state: 'disabled',
      pinchDistance: 1,
      isPinching: false,
      isDragging: false,
      screenX: 0.5,
      screenY: 0.5,
      ndcX: 0,
      ndcY: 0,
      errorMessage: null,
    });
    setFaceTelemetry({
      state: 'disabled',
      mouthScreenX: 0.5,
      mouthScreenY: 0.5,
      mouthNdcX: 0,
      mouthNdcY: 0,
      mouthOpenness: 0,
      isMouthOpen: false,
      isNearMouthpiece: false,
      isExhalingSmoke: false,
      errorMessage: null,
    });
  }, [activateDemoMode, stopStream]);

  const handleResetView = useCallback(() => {
    sceneRef.current?.resetCamera();
    setAutoRotate(true);
  }, []);

  const handleResetMouthpiece = useCallback(() => {
    sceneRef.current?.resetMouthpiece();
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      sceneRef.current?.setAutoRotate(next);
      return next;
    });
  }, []);

  const handleToggleGrid = useCallback(() => {
    setGridVisible((prev) => {
      const next = !prev;
      sceneRef.current?.setGridVisible(next);
      return next;
    });
  }, []);

  const isLiveActive = appMode === 'live_ar' && metrics.status === 'active';
  const isRequestingFeed = metrics.status === 'requesting' || isVisionInitializing;
  const hasCameraError = metrics.status === 'denied' || metrics.status === 'error';
  const isTrackingActive = appMode === 'live_ar' && handTelemetry.state !== 'disabled';

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#06080d',
      }}
    >
      {/* 1. Live Mirrored Webcam Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirrored for intuitive AR alignment
          display: isLiveActive ? 'block' : 'none',
          zIndex: 1,
        }}
      />

      {/* 2. Premium Studio Dark Vignette (Active when not showing live camera) */}
      {!isLiveActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 38%, rgba(20, 31, 56, 0.72) 0%, rgba(8, 12, 20, 0.96) 60%, #030407 100%)',
            zIndex: 1,
          }}
        />
      )}

      {/* 3. Three.js 3D Scene Viewport (Hookah + 3D Smoke Particles) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
        }}
      >
        <SceneContainer ref={sceneRef} onFpsUpdate={setSceneFps} />
      </div>

      {/* 4. Reticle HUD Overlay */}
      <ReticleHUD appMode={appMode} />

      {/* 5. Real-Time AR Hand Reticle & Pinch Overlay */}
      <HandTrackingOverlay
        telemetry={handTelemetry}
        isTrackingActive={isTrackingActive}
      />

      {/* 6. Real-Time AR Lip & Smoke Overlay */}
      <MouthReticleOverlay
        telemetry={faceTelemetry}
        isTrackingActive={isTrackingActive}
      />

      {/* 7. Initializing / Model Loading Spinner Overlay */}
      {(isRequestingFeed || handTelemetry.state === 'loading_model') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            background: 'rgba(6, 8, 13, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              padding: '24px 32px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}
            className="glass-panel-cobalt"
          >
            <Loader2 size={36} color="#60a5fa" className="animate-spin-slow" />
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-silver)',
                }}
              >
                {handTelemetry.state === 'loading_model'
                  ? 'Loading MediaPipe Hand & Face Models...'
                  : 'Initializing Optical Sensor...'}
              </p>
              <p
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--color-silver-muted)',
                  marginTop: '4px',
                }}
              >
                {handTelemetry.state === 'loading_model'
                  ? 'Configuring dual neural vision pipelines'
                  : 'Awaiting camera permission in browser'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. Permission Error Modal */}
      {hasCameraError && appMode === 'live_ar' && (
        <div
          style={{
            position: 'absolute',
            top: '84px',
            right: '24px',
            width: '360px',
            zIndex: 30,
            padding: '18px 20px',
            borderRadius: '12px',
            background: 'rgba(24, 12, 16, 0.88)',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div className="corner-bracket-tl" style={{ borderColor: '#ef4444' }} />
          <div className="corner-bracket-tr" style={{ borderColor: '#ef4444' }} />
          <div className="corner-bracket-bl" style={{ borderColor: '#ef4444' }} />
          <div className="corner-bracket-br" style={{ borderColor: '#ef4444' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#f87171" />
            <h3
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#fca5a5',
              }}
            >
              {metrics.status === 'denied' ? 'Camera Permission Denied' : 'Optical Sensor Notice'}
            </h3>
          </div>

          <p
            style={{
              fontSize: '0.76rem',
              color: '#fecaca',
              marginTop: '10px',
              lineHeight: 1.45,
            }}
          >
            {metrics.errorMessage}
          </p>

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleActivateDemo}
              className="gold-glow-btn"
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <PlayCircle size={14} />
              <span>Use Demo Mode</span>
            </button>

            <button
              onClick={handleStartTracking}
              className="silver-subtle-btn"
              style={{
                padding: '9px 12px',
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. Header Component */}
      <Header
        appMode={appMode}
        autoRotate={autoRotate}
        gridVisible={gridVisible}
        onToggleAutoRotate={handleToggleAutoRotate}
        onToggleGrid={handleToggleGrid}
      />

      {/* 10. Vision & Telemetry Status Panel */}
      <CameraStatusPanel 
        metrics={metrics} 
        sceneFps={sceneFps} 
        handTelemetry={handTelemetry}
        faceTelemetry={faceTelemetry}
        isTrackingActive={isTrackingActive}
        onStopCamera={handleStopTracking}
        onActivateDemo={handleActivateDemo}
        onResetMouthpiece={handleResetMouthpiece}
      />

      {/* 11. Bottom Control Bar */}
      <ControlBar
        appMode={appMode}
        isTrackingActive={isTrackingActive}
        onStartHandTracking={handleStartTracking}
        onStopHandTracking={handleStopTracking}
        onActivateDemo={handleActivateDemo}
        onResetView={handleResetView}
        onResetMouthpiece={handleResetMouthpiece}
      />
    </div>
  );
}

export default App;

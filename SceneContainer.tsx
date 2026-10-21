import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { SceneEngine } from '../../scene/SceneEngine';

export interface SceneContainerRef {
  resetCamera: () => void;
  setAutoRotate: (enabled: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  updateHandDrag: (ndcX: number, ndcY: number) => void;
  releaseHandDrag: () => void;
  resetMouthpiece: () => void;
  isNearMouthpiece: (ndcX: number, ndcY: number, threshold?: number) => boolean;
  getMouthpieceScreenCoords: () => { x: number; y: number };
  setSmokeActive: (active: boolean, mouthNdcX?: number, mouthNdcY?: number) => void;
}

interface SceneContainerProps {
  onFpsUpdate?: (fps: number) => void;
}

export const SceneContainer = forwardRef<SceneContainerRef, SceneContainerProps>(
  ({ onFpsUpdate }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<SceneEngine | null>(null);

    useEffect(() => {
      if (!mountRef.current) return;

      const engine = new SceneEngine(mountRef.current, {
        onFpsUpdate,
      });
      engineRef.current = engine;

      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    }, [onFpsUpdate]);

    useImperativeHandle(ref, () => ({
      resetCamera: () => engineRef.current?.resetCamera(),
      setAutoRotate: (enabled: boolean) => engineRef.current?.setAutoRotate(enabled),
      setGridVisible: (visible: boolean) => engineRef.current?.setGridVisible(visible),
      updateHandDrag: (ndcX: number, ndcY: number) => engineRef.current?.updateHandDrag(ndcX, ndcY),
      releaseHandDrag: () => engineRef.current?.releaseHandDrag(),
      resetMouthpiece: () => engineRef.current?.resetMouthpiece(),
      isNearMouthpiece: (ndcX: number, ndcY: number, threshold?: number) => engineRef.current?.isNearMouthpiece(ndcX, ndcY, threshold) ?? false,
      getMouthpieceScreenCoords: () => engineRef.current?.getMouthpieceScreenCoords() ?? { x: 0.5, y: 0.5 },
      setSmokeActive: (active: boolean, mouthNdcX?: number, mouthNdcY?: number) => engineRef.current?.setSmokeActive(active, mouthNdcX, mouthNdcY),
    }));

    return (
      <div 
        ref={mountRef} 
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          touchAction: 'none',
          cursor: 'grab',
        }}
      />
    );
  }
);

SceneContainer.displayName = 'SceneContainer';

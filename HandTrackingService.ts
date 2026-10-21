import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandTrackingTelemetry, HandTrackingState } from '../types/atmosphere';

export type HandTrackingCallback = (telemetry: HandTrackingTelemetry) => void;

export class HandTrackingService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private callback: HandTrackingCallback | null = null;

  // Gesture hysteresis state
  private isPinching = false;
  private isDragging = false;
  private pinchThresholdOn = 0.075;
  private pinchThresholdOff = 0.095;

  // Frame timing
  private lastVideoTime = -1;

  public async initialize(): Promise<void> {
    if (this.handLandmarker || this.isInitializing) return;

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      // Attempt GPU first, then fallback to CPU if needed
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      } catch (gpuErr) {
        console.warn('MediaPipe GPU initialization failed, falling back to CPU:', gpuErr);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public start(video: HTMLVideoElement, callback: HandTrackingCallback): void {
    this.videoElement = video;
    this.callback = callback;
    this.isRunning = true;
    this.lastVideoTime = -1;

    this.loop();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    if (
      !this.videoElement ||
      !this.handLandmarker ||
      this.videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;

      try {
        const startTimeMs = performance.now();
        const results = this.handLandmarker.detectForVideo(this.videoElement, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0];
          const thumbTip = hand[4];
          const indexTip = hand[8];

          // 3D Euclidean distance between thumb and index tip
          const pinchDistance = Math.hypot(
            thumbTip.x - indexTip.x,
            thumbTip.y - indexTip.y,
            thumbTip.z - indexTip.z
          );

          // Hysteresis for pinch gesture
          if (!this.isPinching && pinchDistance < this.pinchThresholdOn) {
            this.isPinching = true;
          } else if (this.isPinching && pinchDistance > this.pinchThresholdOff) {
            this.isPinching = false;
          }

          // Mirrored coordinates for intuitive screen alignment
          const midX = (thumbTip.x + indexTip.x) * 0.5;
          const midY = (thumbTip.y + indexTip.y) * 0.5;

          const screenX = 1 - midX; // Mirrored
          const screenY = midY;

          const ndcX = screenX * 2 - 1;
          const ndcY = -(screenY * 2 - 1);

          const state: HandTrackingState = this.isDragging 
            ? 'dragging' 
            : this.isPinching 
            ? 'pinching' 
            : 'hand_detected';

          if (this.callback) {
            this.callback({
              state,
              pinchDistance: Math.min(1, Math.max(0, pinchDistance)),
              isPinching: this.isPinching,
              isDragging: this.isDragging,
              screenX,
              screenY,
              ndcX,
              ndcY,
              errorMessage: null,
            });
          }
        } else {
          // No hand detected in current frame
          this.isPinching = false;
          if (this.callback) {
            this.callback({
              state: 'searching',
              pinchDistance: 1,
              isPinching: false,
              isDragging: this.isDragging,
              screenX: 0.5,
              screenY: 0.5,
              ndcX: 0,
              ndcY: 0,
              errorMessage: null,
            });
          }
        }
      } catch (detectErr) {
        console.warn('Frame detection error:', detectErr);
      }
    }
  };

  public setDragging(dragging: boolean): void {
    this.isDragging = dragging;
  }

  public stop(): void {
    this.isRunning = false;
    this.isPinching = false;
    this.isDragging = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public dispose(): void {
    this.stop();
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.videoElement = null;
    this.callback = null;
  }
}

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { FaceTrackingTelemetry } from '../types/atmosphere';

export type FaceTrackingCallback = (telemetry: FaceTrackingTelemetry) => void;

export class FaceTrackingService {
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private callback: FaceTrackingCallback | null = null;

  // Smoothing & hysteresis
  private smoothOpenness = 0;
  private isMouthOpen = false;
  private mouthOpenThresholdOn = 0.22;
  private mouthOpenThresholdOff = 0.16;

  private lastVideoTime = -1;

  public async initialize(): Promise<void> {
    if (this.faceLandmarker || this.isInitializing) return;

    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
      } catch (gpuErr) {
        console.warn('MediaPipe Face GPU initialization failed, falling back to CPU:', gpuErr);
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to initialize MediaPipe FaceLandmarker:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public start(video: HTMLVideoElement, callback: FaceTrackingCallback): void {
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
      !this.faceLandmarker ||
      this.videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;

      try {
        const startTimeMs = performance.now();
        const results = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Key landmarks:
          // 13: upper lip inner center, 14: lower lip inner center
          // 61: mouth left corner, 291: mouth right corner
          const upperLip = landmarks[13];
          const lowerLip = landmarks[14];
          const mouthLeft = landmarks[61];
          const mouthRight = landmarks[291];

          // Blendshape jawOpen metric
          const jawOpenScore = results.faceBlendshapes?.[0]?.categories.find(
            (c) => c.categoryName === 'jawOpen'
          )?.score || 0;

          // Geometric lip distance ratio
          const lipVerticalDist = Math.hypot(
            upperLip.x - lowerLip.x,
            upperLip.y - lowerLip.y,
            upperLip.z - lowerLip.z
          );
          const mouthWidth = Math.hypot(
            mouthLeft.x - mouthRight.x,
            mouthLeft.y - mouthRight.y,
            mouthLeft.z - mouthRight.z
          ) || 0.1;

          const geomRatio = Math.min(1.0, lipVerticalDist / mouthWidth * 2.6);

          // Combined openness score with moving average smoothing to eliminate flicker
          const rawScore = (jawOpenScore * 0.6) + (geomRatio * 0.4);
          this.smoothOpenness = this.smoothOpenness * 0.65 + rawScore * 0.35;

          // Hysteresis thresholding
          if (!this.isMouthOpen && this.smoothOpenness >= this.mouthOpenThresholdOn) {
            this.isMouthOpen = true;
          } else if (this.isMouthOpen && this.smoothOpenness < this.mouthOpenThresholdOff) {
            this.isMouthOpen = false;
          }

          // Mirrored screen coordinates
          const midX = (upperLip.x + lowerLip.x) * 0.5;
          const midY = (upperLip.y + lowerLip.y) * 0.5;

          const mouthScreenX = 1 - midX; // Mirrored
          const mouthScreenY = midY;
          const mouthNdcX = mouthScreenX * 2 - 1;
          const mouthNdcY = -(mouthScreenY * 2 - 1);

          if (this.callback) {
            this.callback({
              state: 'face_detected',
              mouthScreenX,
              mouthScreenY,
              mouthNdcX,
              mouthNdcY,
              mouthOpenness: Math.min(1, Math.max(0, this.smoothOpenness)),
              isMouthOpen: this.isMouthOpen,
              isNearMouthpiece: false, // Calculated by App logic
              isExhalingSmoke: false,  // Calculated by App logic
              errorMessage: null,
            });
          }
        } else {
          // No face detected
          this.isMouthOpen = false;
          this.smoothOpenness = 0;
          if (this.callback) {
            this.callback({
              state: 'searching',
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
          }
        }
      } catch (err) {
        console.warn('Face detection error:', err);
      }
    }
  };

  public stop(): void {
    this.isRunning = false;
    this.isMouthOpen = false;
    this.smoothOpenness = 0;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public dispose(): void {
    this.stop();
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.videoElement = null;
    this.callback = null;
  }
}

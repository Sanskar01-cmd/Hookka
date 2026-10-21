export type AppMode = 'standby' | 'live_ar' | 'demo';

export type CameraStatus = 
  | 'idle' 
  | 'requesting' 
  | 'active' 
  | 'denied' 
  | 'error' 
  | 'demo';

export interface CameraMetrics {
  status: CameraStatus;
  stream: MediaStream | null;
  resolution: { width: number; height: number } | null;
  fps: number;
  deviceName: string;
  errorMessage: string | null;
}

export type HandTrackingState = 
  | 'disabled' 
  | 'loading_model' 
  | 'searching' 
  | 'hand_detected' 
  | 'pinching' 
  | 'dragging' 
  | 'error';

export interface HandTrackingTelemetry {
  state: HandTrackingState;
  pinchDistance: number;
  isPinching: boolean;
  isDragging: boolean;
  screenX: number; // 0 to 1 (mirrored for user perception)
  screenY: number; // 0 to 1
  ndcX: number;    // -1 to 1
  ndcY: number;    // -1 to 1
  errorMessage: string | null;
}

export type FaceTrackingState = 
  | 'disabled' 
  | 'loading_model' 
  | 'searching' 
  | 'face_detected' 
  | 'error';

export interface FaceTrackingTelemetry {
  state: FaceTrackingState;
  mouthScreenX: number; // 0 to 1 (mirrored)
  mouthScreenY: number; // 0 to 1
  mouthNdcX: number;    // -1 to 1
  mouthNdcY: number;    // -1 to 1
  mouthOpenness: number; // 0 to 1
  isMouthOpen: boolean;
  isNearMouthpiece: boolean;
  isExhalingSmoke: boolean;
  errorMessage: string | null;
}

export interface HookahMaterialOptions {
  brassRoughness?: number;
  brassMetalness?: number;
  glassRoughness?: number;
  glassTransmission?: number;
  glassColor?: number | string;
  accentGoldColor?: number | string;
  silverColor?: number | string;
}

export interface RenderStats {
  fps: number;
  drawCalls: number;
  geometries: number;
  textures: number;
}

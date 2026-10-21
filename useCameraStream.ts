import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraMetrics } from '../types/atmosphere';

export function useCameraStream() {
  const [metrics, setMetrics] = useState<CameraMetrics>({
    status: 'idle',
    stream: null,
    resolution: null,
    fps: 0,
    deviceName: 'Standby',
    errorMessage: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setMetrics((prev) => ({
      ...prev,
      status: 'idle',
      stream: null,
      resolution: null,
      fps: 0,
      deviceName: 'Standby',
      errorMessage: null,
    }));
  }, []);

  const startCamera = useCallback(async () => {
    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setMetrics((prev) => ({
      ...prev,
      status: 'requesting',
      errorMessage: null,
    }));

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access (getUserMedia) is not supported in this browser environment.');
      }

      // Request local webcam with mirrored user-facing preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false, // Strictly local video, no audio needed
      });

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack ? videoTrack.getSettings() : null;
      const deviceLabel = videoTrack?.label || 'Front/Webcam Optical Sensor';

      // Attach stream locally to the HTML video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch((playErr) => {
          console.warn('Video play interrupted:', playErr);
        });
      }

      // Handle unexpected hardware disconnection
      videoTrack?.addEventListener('ended', () => {
        stopStream();
      });

      setMetrics({
        status: 'active',
        stream,
        resolution: settings?.width && settings?.height 
          ? { width: settings.width, height: settings.height }
          : { width: 1280, height: 720 },
        fps: settings?.frameRate ? Math.round(settings.frameRate) : 60,
        deviceName: deviceLabel,
        errorMessage: null,
      });
    } catch (err: unknown) {
      let friendlyError = 'Unable to establish webcam connection.';
      let isDenied = false;

      if (err instanceof DOMException || err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          isDenied = true;
          friendlyError = 'Camera permission was denied. Please allow camera access in your browser settings to use Live AR.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          friendlyError = 'No camera hardware found on this machine. Switch to Demo Mode to explore the 3D Hookah.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          friendlyError = 'Webcam is currently occupied by another program. Please close other camera apps and retry.';
        } else {
          friendlyError = err.message || friendlyError;
        }
      }

      setMetrics({
        status: isDenied ? 'denied' : 'error',
        stream: null,
        resolution: null,
        fps: 0,
        deviceName: 'Offline',
        errorMessage: friendlyError,
      });
    }
  }, [stopStream]);

  const activateDemoMode = useCallback(() => {
    stopStream();

    setMetrics({
      status: 'demo',
      stream: null,
      resolution: { width: 1920, height: 1080 },
      fps: 60,
      deviceName: 'Atmosphere Virtual Sensor (Demo)',
      errorMessage: null,
    });
  }, [stopStream]);

  // Clean unmount safety
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    metrics,
    videoRef,
    startCamera,
    activateDemoMode,
    stopStream,
  };
}

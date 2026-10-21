import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HookahModel } from './HookahModel';
import { SmokeParticleSystem } from './SmokeParticleSystem';

export interface SceneEngineCallbacks {
  onFpsUpdate?: (fps: number) => void;
}

export class SceneEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  public hookah: HookahModel;
  private smokeSystem: SmokeParticleSystem;

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isDisposed = false;

  // Frame timing
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private fpsUpdateInterval = 500; // ms
  private lastFpsUpdate = performance.now();

  // Mode settings
  private autoRotate = true;
  private callbacks: SceneEngineCallbacks;

  // Floor and grid
  private groundMesh: THREE.Mesh | null = null;
  private gridHelper: THREE.PolarGridHelper | null = null;

  // Ember light
  private emberPoint: THREE.PointLight | null = null;
  private envMapTexture: THREE.Texture | null = null;

  // Hand tracking interaction state
  private raycaster = new THREE.Raycaster();
  private targetMouthpieceLocalPos: THREE.Vector3 | null = null;
  public isDraggingMouthpiece = false;

  // Smoke emission state
  private isSmokeEmitting = false;
  private mouthWorldPos: THREE.Vector3 = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: SceneEngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(2.8, 1.8, 4.2);

    // 3. Renderer with antialiasing and shadow mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Orbit & Zoom Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.target.set(0, 0.4, 0);
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.autoRotate = false;
    });

    // 5. Setup Studio Environment & Lighting
    this.setupStudioEnvironment();
    this.setupLighting();

    // 6. Setup Ground Floor
    this.setupGround();

    // 7. Load Hookah 3D Model
    this.hookah = new HookahModel();
    this.scene.add(this.hookah.group);

    // 8. Load Smoke Particle System
    this.smokeSystem = new SmokeParticleSystem();
    this.scene.add(this.smokeSystem.group);

    // 9. Handle Resizing
    this.setupResizeObserver();

    // 10. Start Render Loop
    this.animate();
  }

  private setupStudioEnvironment(): void {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();

    const domeGeo = new THREE.SphereGeometry(10, 24, 24);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0x05070d,
      side: THREE.BackSide,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    envScene.add(dome);

    const warmBoxGeo = new THREE.PlaneGeometry(6, 4);
    const warmBoxMat = new THREE.MeshBasicMaterial({ color: 0xffeed0 });
    const warmBox = new THREE.Mesh(warmBoxGeo, warmBoxMat);
    warmBox.position.set(5, 5, 4);
    warmBox.lookAt(0, 0, 0);
    envScene.add(warmBox);

    const cobaltStripGeo = new THREE.PlaneGeometry(2, 8);
    const cobaltStripMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const cobaltStrip = new THREE.Mesh(cobaltStripGeo, cobaltStripMat);
    cobaltStrip.position.set(-6, 3, -4);
    cobaltStrip.lookAt(0, 0, 0);
    envScene.add(cobaltStrip);

    const overheadGeo = new THREE.PlaneGeometry(5, 5);
    const overheadMat = new THREE.MeshBasicMaterial({ color: 0xc8d3e0 });
    const overhead = new THREE.Mesh(overheadGeo, overheadMat);
    overhead.position.set(0, 7, 0);
    overhead.rotation.x = Math.PI / 2;
    envScene.add(overhead);

    const envData = pmremGenerator.fromScene(envScene);
    this.envMapTexture = envData.texture;
    this.scene.environment = this.envMapTexture;

    domeGeo.dispose();
    domeMat.dispose();
    warmBoxGeo.dispose();
    warmBoxMat.dispose();
    cobaltStripGeo.dispose();
    cobaltStripMat.dispose();
    overheadGeo.dispose();
    overheadMat.dispose();
    pmremGenerator.dispose();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x0a101e, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1de, 3.2);
    keyLight.position.set(3.8, 5.2, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 3.5;
    keyLight.shadow.camera.bottom = -1.5;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 3.5;
    this.scene.add(keyLight);

    const cobaltRimLight = new THREE.DirectionalLight(0x2563eb, 4.2);
    cobaltRimLight.position.set(-4.5, 3.5, -3.2);
    this.scene.add(cobaltRimLight);

    const fillLight = new THREE.DirectionalLight(0xa5b4cb, 1.4);
    fillLight.position.set(3.2, 2.0, -3.0);
    this.scene.add(fillLight);

    const overheadLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    overheadLight.position.set(0, 6.0, 1.0);
    this.scene.add(overheadLight);

    this.emberPoint = new THREE.PointLight(0xff4500, 2.2, 2.5, 2.0);
    this.emberPoint.position.set(0, 3.3, 0);
    this.scene.add(this.emberPoint);
  }

  private setupGround(): void {
    const groundGeo = new THREE.CircleGeometry(3.2, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060910,
      metalness: 0.82,
      roughness: 0.28,
      name: 'Mat_StudioFloor',
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -1.19;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.gridHelper = new THREE.PolarGridHelper(2.8, 16, 8, 48, 0xd4af37, 0x1e3a8a);
    this.gridHelper.position.y = -1.185;
    if (this.gridHelper.material instanceof THREE.Material) {
      this.gridHelper.material.transparent = true;
      this.gridHelper.material.opacity = 0.32;
    }
    this.scene.add(this.gridHelper);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || this.isDisposed) return;
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Unprojects 2D NDC coordinates to 3D space on a plane facing the camera passing through the mouthpiece
   */
  public unprojectHandToMouthpieceSpace(ndcX: number, ndcY: number): THREE.Vector3 {
    const worldMouthpiece = this.hookah.handleGroup.getWorldPosition(new THREE.Vector3());

    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir.negate(), worldMouthpiece);

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);

    const localTarget = this.hookah.group.worldToLocal(intersection);

    localTarget.x = Math.max(-2.2, Math.min(2.5, localTarget.x));
    localTarget.y = Math.max(0.2, Math.min(2.8, localTarget.y));
    localTarget.z = Math.max(-0.2, Math.min(3.0, localTarget.z));

    return localTarget;
  }

  /**
   * Unprojects 2D mouth NDC coordinates to 3D world space
   */
  public unprojectMouthToWorld(ndcX: number, ndcY: number): THREE.Vector3 {
    const worldMouthpiece = this.hookah.handleGroup.getWorldPosition(new THREE.Vector3());
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir.negate(), worldMouthpiece);

    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    return intersection;
  }

  public isNearMouthpiece(ndcX: number, ndcY: number, threshold = 0.5): boolean {
    const worldPos = this.hookah.handleGroup.getWorldPosition(new THREE.Vector3());
    const screenPos = worldPos.project(this.camera);
    const dist = Math.hypot(ndcX - screenPos.x, ndcY - screenPos.y);
    return dist < threshold;
  }

  public updateHandDrag(ndcX: number, ndcY: number): void {
    this.isDraggingMouthpiece = true;
    this.autoRotate = false;
    this.targetMouthpieceLocalPos = this.unprojectHandToMouthpieceSpace(ndcX, ndcY);
  }

  public releaseHandDrag(): void {
    this.isDraggingMouthpiece = false;
    this.targetMouthpieceLocalPos = null;
  }

  /**
   * Controls smoke emission state and mouth position
   */
  public setSmokeActive(active: boolean, mouthNdcX = 0, mouthNdcY = 0): void {
    this.isSmokeEmitting = active;
    if (active) {
      this.mouthWorldPos = this.unprojectMouthToWorld(mouthNdcX, mouthNdcY);
    }
  }

  public getMouthpieceScreenCoords(): { x: number; y: number } {
    const worldPos = this.hookah.handleGroup.getWorldPosition(new THREE.Vector3());
    const projected = worldPos.project(this.camera);
    return {
      x: (projected.x + 1) * 0.5,
      y: (-projected.y + 1) * 0.5,
    };
  }

  private animate = (): void => {
    if (this.isDisposed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) * 0.001);
    this.lastFrameTime = now;

    const time = now * 0.001;

    // Turntable rotation if not actively dragging
    if (this.autoRotate && !this.isDraggingMouthpiece) {
      this.hookah.group.rotation.y += 0.0035;
    }

    // Smoothly interpolate mouthpiece during hand drag
    if (this.isDraggingMouthpiece && this.targetMouthpieceLocalPos) {
      const currentPos = this.hookah.getHandlePosition();
      currentPos.lerp(this.targetMouthpieceLocalPos, 0.22);

      const tiltQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-0.25, 0.35, -0.45)
      );
      this.hookah.updateMouthpieceTransform(currentPos, new THREE.Euler().setFromQuaternion(tiltQuat));
    }

    // Update Smoke Particle System
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    this.smokeSystem.update(dt, this.camera, this.isSmokeEmitting, this.mouthWorldPos, cameraDir);

    // Ember breathing pulse
    if (this.emberPoint) {
      this.emberPoint.intensity = 2.0 + Math.sin(time * 2.5) * 0.6;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Calculate FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.callbacks.onFpsUpdate) {
        this.callbacks.onFpsUpdate(fps);
      }
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  };

  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  public resetCamera(): void {
    this.camera.position.set(2.8, 1.8, 4.2);
    this.controls.target.set(0, 0.4, 0);
    this.controls.update();
    this.autoRotate = true;
    this.releaseHandDrag();
    this.hookah.resetMouthpiece();
    this.setSmokeActive(false);
  }

  public resetMouthpiece(): void {
    this.releaseHandDrag();
    this.hookah.resetMouthpiece();
    this.setSmokeActive(false);
  }

  public setGridVisible(visible: boolean): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  public dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.controls.dispose();
    this.hookah.dispose();
    this.smokeSystem.dispose();

    if (this.envMapTexture) {
      this.envMapTexture.dispose();
      this.envMapTexture = null;
    }

    if (this.groundMesh) {
      this.groundMesh.geometry.dispose();
      if (Array.isArray(this.groundMesh.material)) {
        this.groundMesh.material.forEach((m) => m.dispose());
      } else {
        this.groundMesh.material.dispose();
      }
      this.scene.remove(this.groundMesh);
    }

    if (this.gridHelper) {
      this.gridHelper.geometry.dispose();
      if (this.gridHelper.material instanceof THREE.Material) {
        this.gridHelper.material.dispose();
      }
      this.scene.remove(this.gridHelper);
    }

    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

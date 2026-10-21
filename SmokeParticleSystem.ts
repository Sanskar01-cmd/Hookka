import * as THREE from 'three';

interface SmokeParticle {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  startScale: number;
  endScale: number;
  rotationSpeed: number;
  maxOpacity: number;
}

export class SmokeParticleSystem {
  public readonly group: THREE.Group;
  private particles: SmokeParticle[] = [];
  private maxParticles = 120;
  private smokeTexture: THREE.CanvasTexture | null = null;
  private geometry: THREE.PlaneGeometry;

  // Emission rate throttling
  private timeSinceLastSpawn = 0;
  private spawnInterval = 0.07; // ~14 particles per second during active exhalation

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Atmosphere_Smoke_Particle_System';

    this.smokeTexture = this.generateSmokePuffTexture();
    this.geometry = new THREE.PlaneGeometry(1, 1);

    // Initialize particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: this.smokeTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending,
        color: 0xf5f7fb,
      });

      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.visible = false;
      this.group.add(mesh);

      this.particles.push({
        mesh,
        material,
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        age: 0,
        lifetime: 3.0,
        startScale: 0.12,
        endScale: 1.4,
        rotationSpeed: 0,
        maxOpacity: 0.68,
      });
    }
  }

  /**
   * Generates a soft, billowing multi-lobe gaussian cloud puff texture
   */
  private generateSmokePuffTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Draw multiple overlapping soft gaussian radial puffs to create volumetric organic texture
    const puffs = [
      { x: cx, y: cy, r: 100, a: 0.45 },
      { x: cx - 22, y: cy - 14, r: 80, a: 0.35 },
      { x: cx + 24, y: cy + 16, r: 85, a: 0.35 },
      { x: cx - 12, y: cy + 22, r: 75, a: 0.3 },
      { x: cx + 18, y: cy - 20, r: 75, a: 0.3 },
    ];

    for (const puff of puffs) {
      const grad = ctx.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, puff.r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${puff.a})`);
      grad.addColorStop(0.5, `rgba(240, 243, 250, ${puff.a * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Spawns a single smoke particle at the mouth position directed forward
   */
  public spawn(mouthOrigin: THREE.Vector3, cameraDirection: THREE.Vector3): void {
    // Find inactive particle in pool
    const p = this.particles.find((item) => !item.active);
    if (!p) return;

    p.active = true;
    p.age = 0;
    p.lifetime = 2.4 + Math.random() * 1.2; // 2.4 - 3.6s
    p.startScale = 0.12 + Math.random() * 0.06;
    p.endScale = 1.2 + Math.random() * 0.5;
    p.rotationSpeed = (Math.random() - 0.5) * 0.8;
    p.maxOpacity = 0.55 + Math.random() * 0.18;

    // Position at mouth with tiny random jitter
    p.position.copy(mouthOrigin).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.08
      )
    );

    // Velocity directed forward out of mouth toward camera, with conical spread
    const spreadX = (Math.random() - 0.5) * 0.4;
    const spreadY = (Math.random() - 0.3) * 0.3; // Slight upward bias
    const forwardSpeed = 0.9 + Math.random() * 0.6; // Speed forward

    p.velocity
      .copy(cameraDirection)
      .multiplyScalar(-forwardSpeed) // Forward towards camera/viewer
      .add(new THREE.Vector3(spreadX, spreadY, 0));

    p.mesh.position.copy(p.position);
    p.mesh.scale.setScalar(p.startScale);
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
    p.mesh.visible = true;
    p.material.opacity = 0;
  }

  /**
   * Updates particle simulation and handles continuous emission if active
   */
  public update(
    dt: number,
    camera: THREE.Camera,
    isEmitting: boolean,
    mouthOrigin?: THREE.Vector3,
    cameraDir?: THREE.Vector3
  ): void {
    // Handle emission
    if (isEmitting && mouthOrigin && cameraDir) {
      this.timeSinceLastSpawn += dt;
      while (this.timeSinceLastSpawn >= this.spawnInterval) {
        this.spawn(mouthOrigin, cameraDir);
        this.timeSinceLastSpawn -= this.spawnInterval;
      }
    } else {
      this.timeSinceLastSpawn = 0;
    }

    const camQuat = camera.quaternion;

    // Update active particles
    for (const p of this.particles) {
      if (!p.active) continue;

      p.age += dt;
      if (p.age >= p.lifetime) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      const progress = p.age / p.lifetime;

      // Physics: drag (air friction) & gentle thermal buoyancy (rises gently)
      p.velocity.multiplyScalar(Math.pow(0.88, dt * 10)); // Slows down
      p.velocity.y += 0.28 * dt; // Rises naturally

      p.position.addScaledVector(p.velocity, dt);
      p.mesh.position.copy(p.position);

      // Expansion: grows into a billowing cloud
      const currentScale = THREE.MathUtils.lerp(p.startScale, p.endScale, Math.pow(progress, 0.65));
      p.mesh.scale.setScalar(currentScale);

      // Rotation swirl
      p.mesh.rotation.z += p.rotationSpeed * dt;

      // Billboard orientation facing the camera
      p.mesh.quaternion.copy(camQuat);

      // Opacity envelope: fast puff in, smooth fade out
      let opacity = 0;
      if (progress < 0.12) {
        // Fast puff appearance
        opacity = (progress / 0.12) * p.maxOpacity;
      } else {
        // Soft billowing fade
        const fadeProgress = (progress - 0.12) / 0.88;
        opacity = p.maxOpacity * Math.pow(1 - fadeProgress, 1.6);
      }

      p.material.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * Stops spawning and clears all active particles immediately
   */
  public clear(): void {
    for (const p of this.particles) {
      p.active = false;
      p.mesh.visible = false;
      p.material.opacity = 0;
    }
    this.timeSinceLastSpawn = 0;
  }

  public dispose(): void {
    this.clear();
    this.geometry.dispose();
    if (this.smokeTexture) {
      this.smokeTexture.dispose();
      this.smokeTexture = null;
    }
    for (const p of this.particles) {
      p.material.dispose();
    }
    this.particles = [];
  }
}

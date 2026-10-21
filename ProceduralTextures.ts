import * as THREE from 'three';

export class ProceduralTextures {
  private static arabesqueTexture: THREE.CanvasTexture | null = null;
  private static filigreeTexture: THREE.CanvasTexture | null = null;
  private static trayFlutingTexture: THREE.CanvasTexture | null = null;
  private static contactShadowTexture: THREE.CanvasTexture | null = null;

  /**
   * Geometric Arabesque Engraving Map for brass components
   */
  public static getArabesqueEngraving(): THREE.CanvasTexture {
    if (this.arabesqueTexture) return this.arabesqueTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Mid-gray base
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Intricate Islamic/Ottoman geometric star lattice
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const step = 64;
    for (let x = 0; x <= size; x += step) {
      for (let y = 0; y <= size; y += step) {
        // Octagram star diamond pattern
        ctx.beginPath();
        ctx.moveTo(x, y - step / 2);
        ctx.lineTo(x + step / 2, y);
        ctx.lineTo(x, y + step / 2);
        ctx.lineTo(x - step / 2, y);
        ctx.closePath();
        ctx.stroke();

        // Inner square
        ctx.beginPath();
        const inner = step / 3.2;
        ctx.rect(x - inner / 2, y - inner / 2, inner, inner);
        ctx.stroke();

        // Diagonal weave accents
        ctx.beginPath();
        ctx.moveTo(x - step / 2, y - step / 2);
        ctx.lineTo(x + step / 2, y + step / 2);
        ctx.moveTo(x + step / 2, y - step / 2);
        ctx.lineTo(x - step / 2, y + step / 2);
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    texture.needsUpdate = true;
    this.arabesqueTexture = texture;
    return texture;
  }

  /**
   * Intricate Gold Filigree Lace pattern for the glass vase
   */
  public static getGoldFiligree(): THREE.CanvasTexture {
    if (this.filigreeTexture) return this.filigreeTexture;

    const width = 1024;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#d4af37';
    ctx.fillStyle = '#fcebb6';
    ctx.lineWidth = 3;

    // Top and bottom border rails
    ctx.fillRect(0, 10, width, 4);
    ctx.fillRect(0, height - 14, width, 4);

    const repeatStep = 64;
    const count = width / repeatStep;

    for (let i = 0; i < count; i++) {
      const cx = i * repeatStep + repeatStep / 2;
      const cy = height / 2;

      // Outer arch
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.stroke();

      // Inner rosette
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Connecting floral scrolls
      ctx.beginPath();
      ctx.moveTo(cx - 38, cy);
      ctx.bezierCurveTo(cx - 20, cy - 40, cx + 20, cy - 40, cx + 38, cy);
      ctx.bezierCurveTo(cx + 20, cy + 40, cx - 20, cy + 40, cx - 38, cy);
      ctx.stroke();

      // Petite dots
      ctx.beginPath();
      ctx.arc(cx, 30, 4, 0, Math.PI * 2);
      ctx.arc(cx, height - 30, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(6, 1);
    texture.needsUpdate = true;
    this.filigreeTexture = texture;
    return texture;
  }

  /**
   * Radial Scalloped Fluting Map for wide charcoal tray
   */
  public static getTrayFluting(): THREE.CanvasTexture {
    if (this.trayFlutingTexture) return this.trayFlutingTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Concentric grooved rings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let r = 40; r < 240; r += 28) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial flutes (sunburst petals)
    const petals = 24;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
      ctx.lineTo(cx + Math.cos(angle) * 230, cy + Math.sin(angle) * 230);
      ctx.lineWidth = i % 2 === 0 ? 4 : 2;
      ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#b0b0b0';
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.trayFlutingTexture = texture;
    return texture;
  }

  /**
   * Radial Gaussian Contact Shadow Map for grounding the hookah base
   */
  public static getContactShadow(): THREE.CanvasTexture {
    if (this.contactShadowTexture) return this.contactShadowTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.contactShadowTexture = texture;
    return texture;
  }

  public static dispose(): void {
    this.arabesqueTexture?.dispose();
    this.filigreeTexture?.dispose();
    this.trayFlutingTexture?.dispose();
    this.contactShadowTexture?.dispose();
    this.arabesqueTexture = null;
    this.filigreeTexture = null;
    this.trayFlutingTexture = null;
    this.contactShadowTexture = null;
  }
}

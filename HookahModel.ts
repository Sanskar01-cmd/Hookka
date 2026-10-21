import * as THREE from 'three';
import { HookahMaterialOptions } from '../types/atmosphere';
import { ProceduralTextures } from './ProceduralTextures';

export class HookahModel {
  public readonly group: THREE.Group;
  public readonly handleGroup: THREE.Group;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];

  // Dynamic hose components
  private hoseMesh: THREE.Mesh;
  private hoseMaterial: THREE.Material;
  private defaultHandlePos = new THREE.Vector3(0.22, 0.55, 1.25);
  private defaultHandleRot = new THREE.Euler(-0.35, 0.45, -0.6);
  private hoseStartAnchor = new THREE.Vector3(0.38, 1.39, 0.0);

  constructor(options: HookahMaterialOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'Atmosphere_Hookah_Model';
    this.handleGroup = new THREE.Group();
    this.handleGroup.name = 'Hookah_Mouthpiece_Handle';

    // Temporary placeholder before buildModel sets it up
    this.hoseMaterial = new THREE.MeshBasicMaterial();
    this.hoseMesh = new THREE.Mesh();

    this.buildModel(options);
  }

  private registerGeometry<T extends THREE.BufferGeometry>(geo: T): T {
    this.geometries.push(geo);
    return geo;
  }

  private registerMaterial<T extends THREE.Material>(mat: T): T {
    this.materials.push(mat);
    return mat;
  }

  private buildModel(options: HookahMaterialOptions): void {
    const arabesqueBump = ProceduralTextures.getArabesqueEngraving();
    const filigreeMap = ProceduralTextures.getGoldFiligree();
    const trayFluting = ProceduralTextures.getTrayFluting();
    const contactShadowTex = ProceduralTextures.getContactShadow();

    // ----------------------------------------------------
    // 1. PBR MATERIALS WITH PROCEDURAL TEXTURES
    // ----------------------------------------------------
    const brassGold = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: options.accentGoldColor ?? 0xd4af37,
        metalness: options.brassMetalness ?? 0.88,
        roughness: options.brassRoughness ?? 0.22,
        bumpMap: arabesqueBump,
        bumpScale: 0.012,
        name: 'Mat_BrassGold_Engraved',
      })
    );

    const brassSmooth = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: options.accentGoldColor ?? 0xd4af37,
        metalness: 0.92,
        roughness: 0.15,
        name: 'Mat_BrassGold_Smooth',
      })
    );

    const polishedSilver = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: options.silverColor ?? 0xdce2ea,
        metalness: 0.95,
        roughness: 0.14,
        name: 'Mat_Silver',
      })
    );

    const cobaltGlass = this.registerMaterial(
      new THREE.MeshPhysicalMaterial({
        color: options.glassColor ?? 0x073582,
        transmission: options.glassTransmission ?? 0.74,
        opacity: 1.0,
        transparent: true,
        roughness: options.glassRoughness ?? 0.08,
        metalness: 0.05,
        ior: 1.50,
        thickness: 1.5,
        attenuationColor: new THREE.Color(0x0a3d91),
        attenuationDistance: 0.65,
        specularIntensity: 1.0,
        specularColor: new THREE.Color(0xdce2ea),
        clearcoat: 0.35,
        clearcoatRoughness: 0.05,
        name: 'Mat_CobaltGlass_Enhanced',
      })
    );

    const filigreeGold = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.92,
        roughness: 0.22,
        map: filigreeMap,
        alphaMap: filigreeMap,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        name: 'Mat_GoldFiligree',
      })
    );

    const trayMaterial = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: options.accentGoldColor ?? 0xd4af37,
        metalness: 0.88,
        roughness: 0.2,
        bumpMap: trayFluting,
        bumpScale: 0.02,
        name: 'Mat_Tray_Fluted',
      })
    );

    const darkCeramic = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x1a1e26,
        roughness: 0.55,
        metalness: 0.2,
        name: 'Mat_DarkCeramic',
      })
    );

    const emberGlow = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        emissive: 0xea580c,
        emissiveIntensity: 1.1,
        roughness: 0.75,
        metalness: 0.1,
        name: 'Mat_EmberGlow',
      })
    );

    this.hoseMaterial = this.registerMaterial(
      new THREE.MeshStandardMaterial({
        color: 0x0e1320,
        roughness: 0.6,
        metalness: 0.18,
        name: 'Mat_HoseLeather',
      })
    );

    const waterInner = this.registerMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x1e3a8a,
        transmission: 0.94,
        transparent: true,
        roughness: 0.04,
        metalness: 0.02,
        ior: 1.333,
        thickness: 0.9,
        name: 'Mat_Water',
      })
    );

    const contactShadowMat = this.registerMaterial(
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        name: 'Mat_ContactShadow',
      })
    );

    // ----------------------------------------------------
    // 2. CONTACT SHADOW OCCLUSION DISC
    // ----------------------------------------------------
    const contactShadowGeo = this.registerGeometry(new THREE.PlaneGeometry(2.4, 2.4));
    const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadowMesh.rotation.x = -Math.PI / 2;
    contactShadowMesh.position.y = 0.005;
    this.group.add(contactShadowMesh);

    // ----------------------------------------------------
    // 3. PEDESTAL & GLASS BASE
    // ----------------------------------------------------
    const footGeometry = this.registerGeometry(new THREE.CylinderGeometry(0.72, 0.78, 0.06, 48));
    const footMesh = new THREE.Mesh(footGeometry, brassSmooth);
    footMesh.position.y = 0.03;
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    this.group.add(footMesh);

    const baseSphereGeo = this.registerGeometry(new THREE.SphereGeometry(0.74, 56, 42));
    const baseSphereMesh = new THREE.Mesh(baseSphereGeo, cobaltGlass);
    baseSphereMesh.scale.set(1.0, 0.85, 1.0);
    baseSphereMesh.position.y = 0.64;
    baseSphereMesh.castShadow = true;
    baseSphereMesh.receiveShadow = true;
    this.group.add(baseSphereMesh);

    const filigreeBandGeo = this.registerGeometry(new THREE.CylinderGeometry(0.755, 0.755, 0.22, 56, 1, true));
    const filigreeBandMesh = new THREE.Mesh(filigreeBandGeo, filigreeGold);
    filigreeBandMesh.position.y = 0.64;
    this.group.add(filigreeBandMesh);

    const waterGeo = this.registerGeometry(new THREE.CylinderGeometry(0.68, 0.62, 0.5, 36));
    const waterMesh = new THREE.Mesh(waterGeo, waterInner);
    waterMesh.position.y = 0.45;
    this.group.add(waterMesh);

    const goldBandGeo = this.registerGeometry(new THREE.TorusGeometry(0.75, 0.022, 16, 64));
    const goldBand = new THREE.Mesh(goldBandGeo, brassSmooth);
    goldBand.rotation.x = Math.PI / 2;
    goldBand.position.y = 0.64;
    goldBand.castShadow = true;
    this.group.add(goldBand);

    const goldBand2Geo = this.registerGeometry(new THREE.TorusGeometry(0.64, 0.016, 16, 48));
    const goldBand2 = new THREE.Mesh(goldBand2Geo, brassSmooth);
    goldBand2.rotation.x = Math.PI / 2;
    goldBand2.position.y = 0.38;
    this.group.add(goldBand2);

    const glassNeckGeo = this.registerGeometry(new THREE.CylinderGeometry(0.24, 0.48, 0.45, 36));
    const glassNeck = new THREE.Mesh(glassNeckGeo, cobaltGlass);
    glassNeck.position.y = 1.22;
    glassNeck.castShadow = true;
    this.group.add(glassNeck);

    const downstemGeo = this.registerGeometry(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 24));
    const downstemMesh = new THREE.Mesh(downstemGeo, brassSmooth);
    downstemMesh.position.y = 0.7;
    downstemMesh.castShadow = true;
    this.group.add(downstemMesh);

    // ----------------------------------------------------
    // 4. COLLAR & PORTS
    // ----------------------------------------------------
    const collarGeo = this.registerGeometry(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 36));
    const collarMesh = new THREE.Mesh(collarGeo, brassGold);
    collarMesh.position.y = 1.48;
    collarMesh.castShadow = true;
    collarMesh.receiveShadow = true;
    this.group.add(collarMesh);

    const collarSilverGeo = this.registerGeometry(new THREE.TorusGeometry(0.285, 0.02, 16, 36));
    const collarSilver = new THREE.Mesh(collarSilverGeo, polishedSilver);
    collarSilver.rotation.x = Math.PI / 2;
    collarSilver.position.y = 1.54;
    this.group.add(collarSilver);

    const hosePortGeo = this.registerGeometry(new THREE.CylinderGeometry(0.065, 0.08, 0.26, 24));
    const hosePort = new THREE.Mesh(hosePortGeo, brassSmooth);
    hosePort.rotation.z = -Math.PI / 3;
    hosePort.position.set(0.26, 1.46, 0);
    hosePort.castShadow = true;
    this.group.add(hosePort);

    const purgePortGeo = this.registerGeometry(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 24));
    const purgePort = new THREE.Mesh(purgePortGeo, polishedSilver);
    purgePort.rotation.z = Math.PI / 3;
    purgePort.position.set(-0.24, 1.48, 0);
    purgePort.castShadow = true;
    this.group.add(purgePort);

    const purgeCapGeo = this.registerGeometry(new THREE.SphereGeometry(0.05, 16, 16));
    const purgeCap = new THREE.Mesh(purgeCapGeo, brassSmooth);
    purgeCap.position.set(-0.31, 1.52, 0);
    this.group.add(purgeCap);

    // ----------------------------------------------------
    // 5. ORNATE BRASS STEM
    // ----------------------------------------------------
    const stemBulb1Geo = this.registerGeometry(new THREE.SphereGeometry(0.18, 32, 24));
    const stemBulb1 = new THREE.Mesh(stemBulb1Geo, brassGold);
    stemBulb1.scale.set(1.1, 0.85, 1.1);
    stemBulb1.position.y = 1.72;
    stemBulb1.castShadow = true;
    this.group.add(stemBulb1);

    const stemRing1Geo = this.registerGeometry(new THREE.TorusGeometry(0.21, 0.02, 16, 32));
    const stemRing1 = new THREE.Mesh(stemRing1Geo, polishedSilver);
    stemRing1.rotation.x = Math.PI / 2;
    stemRing1.position.y = 1.84;
    this.group.add(stemRing1);

    const stemColumn1Geo = this.registerGeometry(new THREE.CylinderGeometry(0.08, 0.12, 0.45, 32));
    const stemColumn1 = new THREE.Mesh(stemColumn1Geo, brassGold);
    stemColumn1.position.y = 2.08;
    stemColumn1.castShadow = true;
    this.group.add(stemColumn1);

    const enamelSleeveGeo = this.registerGeometry(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 32));
    const enamelSleeve = new THREE.Mesh(enamelSleeveGeo, cobaltGlass);
    enamelSleeve.position.y = 2.32;
    enamelSleeve.castShadow = true;
    this.group.add(enamelSleeve);

    const cageRingGeo = this.registerGeometry(new THREE.TorusGeometry(0.155, 0.016, 16, 32));
    const cageRingTop = new THREE.Mesh(cageRingGeo, brassSmooth);
    cageRingTop.rotation.x = Math.PI / 2;
    cageRingTop.position.y = 2.43;
    this.group.add(cageRingTop);

    const cageRingBottom = new THREE.Mesh(cageRingGeo, brassSmooth);
    cageRingBottom.rotation.x = Math.PI / 2;
    cageRingBottom.position.y = 2.21;
    this.group.add(cageRingBottom);

    const stemBulb2Geo = this.registerGeometry(new THREE.SphereGeometry(0.16, 32, 24));
    const stemBulb2 = new THREE.Mesh(stemBulb2Geo, brassGold);
    stemBulb2.scale.set(1.15, 0.8, 1.15);
    stemBulb2.position.y = 2.58;
    stemBulb2.castShadow = true;
    this.group.add(stemBulb2);

    const stemColumn2Geo = this.registerGeometry(new THREE.CylinderGeometry(0.075, 0.1, 0.38, 32));
    const stemColumn2 = new THREE.Mesh(stemColumn2Geo, brassGold);
    stemColumn2.position.y = 2.82;
    stemColumn2.castShadow = true;
    this.group.add(stemColumn2);

    const trayCollarGeo = this.registerGeometry(new THREE.CylinderGeometry(0.18, 0.08, 0.12, 32));
    const trayCollar = new THREE.Mesh(trayCollarGeo, polishedSilver);
    trayCollar.position.y = 3.06;
    trayCollar.castShadow = true;
    this.group.add(trayCollar);

    // ----------------------------------------------------
    // 6. WIDE CHARCOAL TRAY
    // ----------------------------------------------------
    const trayPlateGeo = this.registerGeometry(new THREE.CylinderGeometry(0.88, 0.74, 0.035, 48));
    const trayPlate = new THREE.Mesh(trayPlateGeo, trayMaterial);
    trayPlate.position.y = 3.12;
    trayPlate.castShadow = true;
    trayPlate.receiveShadow = true;
    this.group.add(trayPlate);

    const trayRimGeo = this.registerGeometry(new THREE.TorusGeometry(0.88, 0.024, 16, 64));
    const trayRim = new THREE.Mesh(trayRimGeo, polishedSilver);
    trayRim.rotation.x = Math.PI / 2;
    trayRim.position.y = 3.14;
    trayRim.castShadow = true;
    this.group.add(trayRim);

    const trayInnerRingGeo = this.registerGeometry(new THREE.TorusGeometry(0.42, 0.014, 16, 48));
    const trayInnerRing = new THREE.Mesh(trayInnerRingGeo, polishedSilver);
    trayInnerRing.rotation.x = Math.PI / 2;
    trayInnerRing.position.y = 3.14;
    this.group.add(trayInnerRing);

    // ----------------------------------------------------
    // 7. TOP BOWL & HEAT MANAGEMENT
    // ----------------------------------------------------
    const bowlStemGeo = this.registerGeometry(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 28));
    const bowlStem = new THREE.Mesh(bowlStemGeo, darkCeramic);
    bowlStem.position.y = 3.24;
    bowlStem.castShadow = true;
    this.group.add(bowlStem);

    const bowlHeadGeo = this.registerGeometry(new THREE.CylinderGeometry(0.34, 0.15, 0.28, 36));
    const bowlHead = new THREE.Mesh(bowlHeadGeo, darkCeramic);
    bowlHead.position.y = 3.46;
    bowlHead.castShadow = true;
    bowlHead.receiveShadow = true;
    this.group.add(bowlHead);

    const hmdBodyGeo = this.registerGeometry(new THREE.CylinderGeometry(0.31, 0.3, 0.14, 36));
    const hmdBody = new THREE.Mesh(hmdBodyGeo, polishedSilver);
    hmdBody.position.y = 3.63;
    hmdBody.castShadow = true;
    this.group.add(hmdBody);

    const emberDiscGeo = this.registerGeometry(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24));
    const emberDisc = new THREE.Mesh(emberDiscGeo, emberGlow);
    emberDisc.position.y = 3.68;
    this.group.add(emberDisc);

    const hmdLidGeo = this.registerGeometry(new THREE.CylinderGeometry(0.28, 0.31, 0.04, 32));
    const hmdLid = new THREE.Mesh(hmdLidGeo, polishedSilver);
    hmdLid.position.y = 3.72;
    hmdLid.castShadow = true;
    this.group.add(hmdLid);

    const hmdKnobGeo = this.registerGeometry(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16));
    const hmdKnob = new THREE.Mesh(hmdKnobGeo, brassSmooth);
    hmdKnob.position.y = 3.77;
    this.group.add(hmdKnob);

    // ----------------------------------------------------
    // 8. DYNAMIC FLEXIBLE HOSE & MOUTHPIECE
    // ----------------------------------------------------
    // Base connector band
    const hoseBand1Geo = this.registerGeometry(new THREE.TorusGeometry(0.052, 0.012, 16, 24));
    const hoseBand1 = new THREE.Mesh(hoseBand1Geo, brassSmooth);
    hoseBand1.position.set(0.39, 1.38, 0.01);
    this.group.add(hoseBand1);

    // Assemble the movable handle & mouthpiece
    this.handleGroup.position.copy(this.defaultHandlePos);
    this.handleGroup.rotation.copy(this.defaultHandleRot);

    const gripGeo = this.registerGeometry(new THREE.CylinderGeometry(0.038, 0.044, 0.65, 24));
    const gripMesh = new THREE.Mesh(gripGeo, this.hoseMaterial);
    gripMesh.castShadow = true;
    this.handleGroup.add(gripMesh);

    const gripRingGeo = this.registerGeometry(new THREE.TorusGeometry(0.045, 0.009, 12, 24));
    const gripRing1 = new THREE.Mesh(gripRingGeo, brassSmooth);
    gripRing1.position.y = -0.15;
    this.handleGroup.add(gripRing1);

    const gripRing2 = new THREE.Mesh(gripRingGeo, brassSmooth);
    gripRing2.position.y = 0.15;
    this.handleGroup.add(gripRing2);

    const mouthTipGeo = this.registerGeometry(new THREE.CylinderGeometry(0.018, 0.034, 0.32, 24));
    const mouthTip = new THREE.Mesh(mouthTipGeo, brassSmooth);
    mouthTip.position.y = 0.46;
    mouthTip.castShadow = true;
    this.handleGroup.add(mouthTip);

    const mouthCrownGeo = this.registerGeometry(new THREE.TorusGeometry(0.02, 0.006, 12, 24));
    const mouthCrown = new THREE.Mesh(mouthCrownGeo, polishedSilver);
    mouthCrown.rotation.x = Math.PI / 2;
    mouthCrown.position.y = 0.61;
    this.handleGroup.add(mouthCrown);

    this.group.add(this.handleGroup);

    // Build the initial hose mesh connecting base to handle
    const initialCurve = this.calculateHoseSpline(this.defaultHandlePos);
    const initialHoseGeo = this.registerGeometry(
      new THREE.TubeGeometry(initialCurve, 64, 0.042, 14, false)
    );
    this.hoseMesh = new THREE.Mesh(initialHoseGeo, this.hoseMaterial);
    this.hoseMesh.castShadow = true;
    this.hoseMesh.receiveShadow = true;
    this.group.add(this.hoseMesh);

    // Center and scale whole group
    this.group.position.y = -1.2;
    this.group.scale.set(1.2, 1.2, 1.2);
  }

  /**
   * Calculates a natural physical catenary spline from the fixed collar port to the moving mouthpiece
   */
  private calculateHoseSpline(handlePos: THREE.Vector3): THREE.CatmullRomCurve3 {
    const p0 = this.hoseStartAnchor.clone(); // (0.38, 1.39, 0.0)
    const p1 = new THREE.Vector3(0.65, 1.15, 0.15); // Outward arch from collar

    // Handle connection socket (bottom of grip mesh, y = -0.3 in handle local space)
    const handleBottom = handlePos.clone().add(new THREE.Vector3(0, -0.22, -0.05));

    // Distance vector
    const delta = new THREE.Vector3().subVectors(handleBottom, p1);
    const dist = delta.length();

    // Natural catenary droop calculation based on length and distance
    const droopDepth = Math.max(0.12, Math.min(1.0, 1.4 - dist * 0.4));
    const midX = (p1.x + handleBottom.x) * 0.5;
    const midZ = (p1.z + handleBottom.z) * 0.5;
    const midY = Math.min(p1.y, handleBottom.y) * 0.35 + 0.12;

    const p2 = new THREE.Vector3(
      p1.x + (midX - p1.x) * 0.6,
      Math.max(0.14, midY - droopDepth * 0.2),
      p1.z + (midZ - p1.z) * 0.6 + 0.25
    );

    const p3 = new THREE.Vector3(
      midX + 0.15,
      Math.max(0.12, midY * 0.8),
      midZ + 0.35
    );

    const p4 = new THREE.Vector3(
      handleBottom.x + (midX - handleBottom.x) * 0.35,
      Math.max(0.25, handleBottom.y * 0.65),
      handleBottom.z + 0.1
    );

    return new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, handleBottom]);
  }

  /**
   * Updates the mouthpiece position & re-splines the flexible hose
   */
  public updateMouthpieceTransform(
    localPos: THREE.Vector3,
    localEuler?: THREE.Euler
  ): void {
    this.handleGroup.position.copy(localPos);
    if (localEuler) {
      this.handleGroup.rotation.copy(localEuler);
    }

    // Recompute hose spline
    const newCurve = this.calculateHoseSpline(localPos);

    // Dispose old geometry and assign new tube
    if (this.hoseMesh.geometry) {
      this.hoseMesh.geometry.dispose();
    }
    this.hoseMesh.geometry = new THREE.TubeGeometry(newCurve, 64, 0.042, 14, false);
  }

  /**
   * Returns current local handle position
   */
  public getHandlePosition(): THREE.Vector3 {
    return this.handleGroup.position.clone();
  }

  /**
   * Returns default resting position
   */
  public getDefaultHandlePosition(): THREE.Vector3 {
    return this.defaultHandlePos.clone();
  }

  /**
   * Resets mouthpiece back to default resting cradle
   */
  public resetMouthpiece(): void {
    this.updateMouthpieceTransform(this.defaultHandlePos.clone(), this.defaultHandleRot.clone());
  }

  public dispose(): void {
    if (this.hoseMesh.geometry) {
      this.hoseMesh.geometry.dispose();
    }

    for (const geo of this.geometries) {
      geo.dispose();
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.geometries.length = 0;
    this.materials.length = 0;

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
  }
}

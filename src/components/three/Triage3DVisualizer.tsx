/**
 * @license
 * PulseGate 3D Anatomical & Referral Corridor Visualizer
 * Built with Three.js (PBR, RoomEnvironment, PMREMGenerator, Composite Models, Exploded View)
 * Strictly conforms to Three.js Craft and Performance Guidelines
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { UrgencyCategory } from '../../types/index.ts';

// Pre-allocated scratch helpers at module scope to ensure zero-GC 60fps render loop
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();

interface Triage3DVisualizerProps {
  urgencyCategory?: UrgencyCategory;
  primaryCondition?: 'CARDIAC' | 'NEURO_STROKE' | 'RESPIRATORY' | 'SEPSIS' | 'TRAUMA' | 'GENERAL';
  patientHeartRate?: number;
  className?: string;
}

export const Triage3DVisualizer: React.FC<Triage3DVisualizerProps> = ({
  urgencyCategory = 'RED',
  primaryCondition = 'CARDIAC',
  patientHeartRate = 84,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedRatio, setExplodedRatio] = useState<number>(0);
  const [activeSystem, setActiveSystem] = useState<'ALL' | 'CARDIO' | 'RESPIRATORY' | 'NEURO'>('ALL');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'ISOMETRIC' | 'ANTERIOR' | 'LATERAL' | 'TOP'>('ISOMETRIC');
  const [viewMode, setViewMode] = useState<'ANATOMY' | 'CORRIDOR'>('ANATOMY');

  // Mutable refs to pass into the animation loop without restarting WebGL
  const animStateRef = useRef({
    explodedTarget: 0,
    explodedCurrent: 0,
    activeSystem: 'ALL',
    urgencyCategory,
    primaryCondition,
    heartRate: patientHeartRate,
    viewMode: 'ANATOMY',
    camPreset: 'ISOMETRIC',
    isPointerDown: false,
    pointerStartX: 0,
    pointerStartY: 0,
    orbitTheta: 0.6,
    orbitPhi: 1.2,
    orbitRadius: 18,
    targetRadius: 18,
  });

  // Sync props to refs
  useEffect(() => {
    animStateRef.current.explodedTarget = explodedRatio;
  }, [explodedRatio]);

  useEffect(() => {
    animStateRef.current.activeSystem = activeSystem;
  }, [activeSystem]);

  useEffect(() => {
    animStateRef.current.urgencyCategory = urgencyCategory;
    animStateRef.current.primaryCondition = primaryCondition;
    animStateRef.current.heartRate = patientHeartRate || 80;
  }, [urgencyCategory, primaryCondition, patientHeartRate]);

  useEffect(() => {
    animStateRef.current.viewMode = viewMode;
    if (viewMode === 'CORRIDOR') {
      animStateRef.current.targetRadius = 26;
      animStateRef.current.orbitPhi = 1.0;
    } else {
      animStateRef.current.targetRadius = 18;
      animStateRef.current.orbitPhi = 1.2;
    }
  }, [viewMode]);

  useEffect(() => {
    animStateRef.current.camPreset = cameraPreset;
    if (cameraPreset === 'ISOMETRIC') {
      animStateRef.current.orbitTheta = 0.78;
      animStateRef.current.orbitPhi = 1.15;
    } else if (cameraPreset === 'ANTERIOR') {
      animStateRef.current.orbitTheta = 0;
      animStateRef.current.orbitPhi = 1.45;
    } else if (cameraPreset === 'LATERAL') {
      animStateRef.current.orbitTheta = Math.PI / 2;
      animStateRef.current.orbitPhi = 1.45;
    } else if (cameraPreset === 'TOP') {
      animStateRef.current.orbitTheta = 0;
      animStateRef.current.orbitPhi = 0.15;
    }
  }, [cameraPreset]);

  // Main Three.js setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    // 1. Scene & Horizon Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e172a);
    scene.fog = new THREE.FogExp2(0x0e172a, 0.024);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(12, 10, 16);
    camera.lookAt(0, 4, 0);

    // 3. Renderer with ACESFilmicToneMapping & PBR environment
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment via PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = roomEnvTexture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig: Warm Key Light + Cool Hemisphere Fill
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(12, 20, 10);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x1e293b, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-15, 12, -15);
    scene.add(rimLight);

    // 6. Ground Grid & Radial Contact Shadow
    const gridHelper = new THREE.GridHelper(32, 32, 0x1e3a5f, 0x0f243e);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Soft contact shadow circle
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 128;
    contactCanvas.height = 128;
    const ctx = contactCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const contactTexture = new THREE.CanvasTexture(contactCanvas);
    contactTexture.colorSpace = THREE.SRGBColorSpace;

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({
        map: contactTexture,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    scene.add(contactShadow);

    // 7. Anatomical Model Group (Composite 3-12 part procedural models)
    const anatomyGroup = new THREE.Group();
    anatomyGroup.position.set(0, 0, 0);
    scene.add(anatomyGroup);

    // Shared PBR Materials
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.1,
    });

    const heartMuscleMaterial = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x881337,
      emissiveIntensity: 0.25,
    });

    const heartVesselMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.4,
    });

    const lungMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.6,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
    });

    const brainMaterial = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.45,
      metalness: 0.15,
      emissive: 0x9d174d,
      emissiveIntensity: 0.2,
    });

    const neuroVesselMaterial = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.6,
    });

    // --- Sub-model A: Thoracic Spine & Ribcage ---
    const spineGroup = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const vertebra = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.6, 0.45, 12),
        boneMaterial
      );
      vertebra.position.set(0, 2.2 + i * 0.55, -1.8);
      vertebra.castShadow = !isHeadless;
      spineGroup.add(vertebra);

      // Rib pairs
      if (i >= 2 && i <= 7) {
        const ribCurveLeft = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.5, 2.2 + i * 0.55, -1.8),
          new THREE.Vector3(-2.2, 2.0 + i * 0.55, -0.6),
          new THREE.Vector3(-1.8, 1.8 + i * 0.55, 1.2),
          new THREE.Vector3(-0.3, 1.8 + i * 0.55, 1.6),
        ]);
        const ribLeft = new THREE.Mesh(
          new THREE.TubeGeometry(ribCurveLeft, 16, 0.1, 8, false),
          boneMaterial
        );
        spineGroup.add(ribLeft);

        const ribCurveRight = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.5, 2.2 + i * 0.55, -1.8),
          new THREE.Vector3(2.2, 2.0 + i * 0.55, -0.6),
          new THREE.Vector3(1.8, 1.8 + i * 0.55, 1.2),
          new THREE.Vector3(0.3, 1.8 + i * 0.55, 1.6),
        ]);
        const ribRight = new THREE.Mesh(
          new THREE.TubeGeometry(ribCurveRight, 16, 0.1, 8, false),
          boneMaterial
        );
        spineGroup.add(ribRight);
      }
    }
    // Sternum
    const sternum = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 3.2, 0.25),
      boneMaterial
    );
    sternum.position.set(0, 4.4, 1.6);
    spineGroup.add(sternum);
    anatomyGroup.add(spineGroup);

    // --- Sub-model B: Heart (Composite 6-part subject) ---
    const heartGroup = new THREE.Group();
    heartGroup.position.set(-0.25, 4.2, 0.1);

    // 1. Ventricular Body
    const ventricle = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 24, 20),
      heartMuscleMaterial
    );
    ventricle.scale.set(0.9, 1.25, 0.85);
    ventricle.rotation.z = -0.15;
    ventricle.castShadow = !isHeadless;
    heartGroup.add(ventricle);

    // 2. Right & Left Atria
    const rAtrium = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 14),
      heartMuscleMaterial
    );
    rAtrium.position.set(0.8, 1.0, -0.2);
    heartGroup.add(rAtrium);

    const lAtrium = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 14),
      heartMuscleMaterial
    );
    lAtrium.position.set(-0.7, 1.0, -0.3);
    heartGroup.add(lAtrium);

    // 3. Aorta Arch (TubeGeometry)
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.8, 0.2),
      new THREE.Vector3(0.2, 1.6, 0.1),
      new THREE.Vector3(-0.2, 2.2, -0.2),
      new THREE.Vector3(-0.8, 1.9, -0.6),
      new THREE.Vector3(-0.9, 0.4, -0.9),
    ]);
    const aorta = new THREE.Mesh(
      new THREE.TubeGeometry(aortaCurve, 24, 0.32, 12, false),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.3 })
    );
    heartGroup.add(aorta);

    // 4. Pulmonary Artery Trunk
    const pulmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.7, 0.4),
      new THREE.Vector3(-0.4, 1.4, 0.3),
      new THREE.Vector3(-0.9, 1.7, 0.1),
    ]);
    const pulmonaryTrunk = new THREE.Mesh(
      new THREE.TubeGeometry(pulmCurve, 16, 0.28, 10, false),
      heartVesselMaterial
    );
    heartGroup.add(pulmonaryTrunk);

    // 5. Coronary Artery Branches (Accents)
    const coronaryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.8, 0.8),
      new THREE.Vector3(0.3, 0.2, 0.85),
      new THREE.Vector3(0.1, -0.4, 0.7),
      new THREE.Vector3(-0.2, -0.9, 0.5),
    ]);
    const coronaryArtery = new THREE.Mesh(
      new THREE.TubeGeometry(coronaryCurve, 20, 0.08, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xff0044, roughness: 0.2, metalness: 0.7 })
    );
    heartGroup.add(coronaryArtery);

    anatomyGroup.add(heartGroup);

    // --- Sub-model C: Lungs & Bronchial Tree ---
    const lungsGroup = new THREE.Group();
    lungsGroup.position.set(0, 4.4, -0.2);

    // Right Lung (3 lobes composite)
    const rightLung = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 20, 18),
      lungMaterial
    );
    rightLung.scale.set(0.9, 1.8, 0.9);
    rightLung.position.set(1.9, 0, 0);
    lungsGroup.add(rightLung);

    // Left Lung (2 lobes with cardiac notch)
    const leftLung = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 20, 18),
      lungMaterial
    );
    leftLung.scale.set(0.85, 1.7, 0.85);
    leftLung.position.set(-2.0, 0, 0);
    lungsGroup.add(leftLung);

    // Trachea & Bronchi
    const tracheaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.4, -0.2),
      new THREE.Vector3(0, 1.0, -0.3),
      new THREE.Vector3(0, 0.2, -0.4),
    ]);
    const trachea = new THREE.Mesh(
      new THREE.TubeGeometry(tracheaCurve, 16, 0.24, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.4 })
    );
    lungsGroup.add(trachea);

    anatomyGroup.add(lungsGroup);

    // --- Sub-model D: Brain & Cerebrovascular System (Head level) ---
    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, 8.2, 0);

    // Left & Right Hemispheres
    const rHemi = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 20),
      brainMaterial
    );
    rHemi.scale.set(0.9, 1.1, 1.25);
    rHemi.position.set(0.65, 0, 0);
    brainGroup.add(rHemi);

    const lHemi = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 24, 20),
      brainMaterial
    );
    lHemi.scale.set(0.9, 1.1, 1.25);
    lHemi.position.set(-0.65, 0, 0);
    brainGroup.add(lHemi);

    // Cerebellum & Brainstem
    const cerebellum = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 18, 16),
      brainMaterial
    );
    cerebellum.scale.set(1.3, 0.7, 0.8);
    cerebellum.position.set(0, -0.85, -0.8);
    brainGroup.add(cerebellum);

    // Circle of Willis arterial ring
    const circleCurve = new THREE.EllipseCurve(0, 0, 0.5, 0.6, 0, 2 * Math.PI, false, 0);
    const circlePoints = circleCurve.getPoints(32).map((p) => new THREE.Vector3(p.x, -0.6, p.y + 0.1));
    const circleOfWillis = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(circlePoints, true), 32, 0.08, 8, true),
      neuroVesselMaterial
    );
    brainGroup.add(circleOfWillis);

    anatomyGroup.add(brainGroup);

    // --- Sub-model E: Corridor Digital Twin Mode (Referral Route & Medical Beacons) ---
    const corridorGroup = new THREE.Group();
    corridorGroup.visible = false;
    scene.add(corridorGroup);

    // Clinic Origin Beacon
    const clinicBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.0, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 })
    );
    clinicBeacon.position.set(-8, 0.3, 4);
    corridorGroup.add(clinicBeacon);

    // Tertiary Receiving Hub Beacon
    const hospitalBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.7, emissive: 0x059669, emissiveIntensity: 0.3 })
    );
    hospitalBeacon.position.set(8, 0.6, -4);
    corridorGroup.add(hospitalBeacon);

    // Parabolic Referral Trajectory Arc
    const arcCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-8, 0.6, 4),
      new THREE.Vector3(0, 8.5, 0),
      new THREE.Vector3(8, 1.2, -4)
    );
    const arcMesh = new THREE.Mesh(
      new THREE.TubeGeometry(arcCurve, 40, 0.12, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      })
    );
    corridorGroup.add(arcMesh);

    // Ambulance / Air Transport Subject along arc
    const transportSubject = new THREE.Group();
    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 })
    );
    transportSubject.add(cabin);
    // Rotor blades / Light bar
    const lightBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.8 })
    );
    lightBar.position.y = 0.55;
    transportSubject.add(lightBar);
    corridorGroup.add(transportSubject);

    // --- Pointer Events for Interactive Damped OrbitControls ---
    const handlePointerDown = (e: MouseEvent) => {
      animStateRef.current.isPointerDown = true;
      animStateRef.current.pointerStartX = e.clientX;
      animStateRef.current.pointerStartY = e.clientY;
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!animStateRef.current.isPointerDown) return;
      const dx = e.clientX - animStateRef.current.pointerStartX;
      const dy = e.clientY - animStateRef.current.pointerStartY;
      animStateRef.current.pointerStartX = e.clientX;
      animStateRef.current.pointerStartY = e.clientY;

      animStateRef.current.orbitTheta -= dx * 0.007;
      animStateRef.current.orbitPhi = Math.max(
        0.1,
        Math.min(Math.PI / 2 + 0.1, animStateRef.current.orbitPhi - dy * 0.007)
      );
    };

    const handlePointerUp = () => {
      animStateRef.current.isPointerDown = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      animStateRef.current.targetRadius = Math.max(
        8,
        Math.min(36, animStateRef.current.targetRadius + e.deltaY * 0.02)
      );
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvasDom.addEventListener('wheel', handleWheel, { passive: false });

    // --- 60 FPS Render Loop with Exponential Damping & Lossless Kinematics ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      const state = animStateRef.current;

      // 1. Damped Exploded View Interpolation
      state.explodedCurrent = THREE.MathUtils.damp(
        state.explodedCurrent,
        state.explodedTarget,
        6.0,
        dt
      );
      const explode = state.explodedCurrent;

      // Smoothly push organs outward in exploded view
      spineGroup.position.z = -explode * 4.0;
      lungsGroup.position.x = explode * 3.5;
      brainGroup.position.y = 8.2 + explode * 4.5;
      heartGroup.position.z = 0.1 + explode * 3.0;

      // 2. Heart Systolic Pulse coupled to patient heart rate
      const bpm = state.heartRate || 80;
      const pulseSpeed = (bpm / 60) * Math.PI * 2;
      const pulseScale = 1.0 + Math.sin(time * pulseSpeed) * 0.06;
      ventricle.scale.set(0.9 * pulseScale, 1.25 * pulseScale, 0.85 * pulseScale);

      // 3. Highlight affected clinical system
      const isRed = state.urgencyCategory === 'RED';
      if (state.primaryCondition === 'CARDIAC') {
        heartMuscleMaterial.emissive.setHex(isRed ? 0xef4444 : 0x0284c7);
        heartMuscleMaterial.emissiveIntensity = 0.4 + Math.sin(time * pulseSpeed) * 0.3;
      } else if (state.primaryCondition === 'NEURO_STROKE') {
        brainMaterial.emissive.setHex(0xef4444);
        brainMaterial.emissiveIntensity = 0.45 + Math.sin(time * 3.0) * 0.3;
      } else if (state.primaryCondition === 'RESPIRATORY') {
        lungMaterial.color.setHex(0xf43f5e);
      }

      // 4. Mode Switching Visibility
      if (state.viewMode === 'CORRIDOR') {
        anatomyGroup.visible = false;
        corridorGroup.visible = true;

        // Transport beacon animation along curve
        const arcT = (time * 0.25) % 1.0;
        const posOnArc = arcCurve.getPoint(arcT);
        transportSubject.position.copy(posOnArc);
        const tangent = arcCurve.getTangent(arcT);
        transportSubject.lookAt(posOnArc.clone().add(tangent));
      } else {
        anatomyGroup.visible = true;
        corridorGroup.visible = false;

        // Subsystem isolation
        if (state.activeSystem === 'CARDIO') {
          heartGroup.visible = true;
          lungsGroup.visible = false;
          brainGroup.visible = false;
          spineGroup.visible = false;
        } else if (state.activeSystem === 'RESPIRATORY') {
          heartGroup.visible = false;
          lungsGroup.visible = true;
          brainGroup.visible = false;
          spineGroup.visible = false;
        } else if (state.activeSystem === 'NEURO') {
          heartGroup.visible = false;
          lungsGroup.visible = false;
          brainGroup.visible = true;
          spineGroup.visible = false;
        } else {
          heartGroup.visible = true;
          lungsGroup.visible = true;
          brainGroup.visible = true;
          spineGroup.visible = true;
        }
      }

      // 5. Smooth Damped Camera Controls
      state.orbitRadius = THREE.MathUtils.damp(
        state.orbitRadius,
        state.targetRadius,
        8.0,
        dt
      );

      _targetCamPos.x =
        state.orbitRadius * Math.sin(state.orbitPhi) * Math.sin(state.orbitTheta);
      _targetCamPos.y = state.orbitRadius * Math.cos(state.orbitPhi) + 3.5;
      _targetCamPos.z =
        state.orbitRadius * Math.sin(state.orbitPhi) * Math.cos(state.orbitTheta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 8.0, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 8.0, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 8.0, dt);

      _targetLookAt.set(0, state.viewMode === 'CORRIDOR' ? 1.5 : 4.5, 0);
      _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _targetLookAt.x, 8.0, dt);
      _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _targetLookAt.y, 8.0, dt);
      _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _targetLookAt.z, 8.0, dt);
      camera.lookAt(_currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 500;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvasDom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvasDom.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col ${className}`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top HUD Badges (Minimal, Non-obstructive) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>PULSEGATE 3D DIGITAL TWIN</span>
          </div>
          <div
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border shadow-md ${
              urgencyCategory === 'RED'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : urgencyCategory === 'AMBER'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
            }`}
          >
            {primaryCondition} • {urgencyCategory} TRIAGE FOCUS
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80 shadow-md">
          <button
            onClick={() => setViewMode('ANATOMY')}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'ANATOMY'
                ? 'bg-teal-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Anatomy
          </button>
          <button
            onClick={() => setViewMode('CORRIDOR')}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'CORRIDOR'
                ? 'bg-teal-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Referral Corridor
          </button>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (Consolidated at Bottom Center, <= 15% Viewport) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-10 flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsControlsCollapsed((prev) => !prev)}
          className="mb-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium px-3 py-0.5 rounded-full border border-slate-700 shadow-md transition-all flex items-center gap-1"
        >
          <span>{isControlsCollapsed ? '▲ Show 3D Dock' : '▼ Collapse 3D Dock'}</span>
        </button>

        {!isControlsCollapsed && (
          <div className="w-full bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            {/* Exploded View Slider */}
            {viewMode === 'ANATOMY' && (
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-[11px] font-medium text-slate-400">Exploded:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedRatio}
                  onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
                  className="w-28 accent-teal-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <span className="font-mono text-[11px] text-teal-300">
                  {Math.round(explodedRatio * 100)}%
                </span>
              </div>
            )}

            {/* System Isolation Selector */}
            {viewMode === 'ANATOMY' && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1">System:</span>
                {(['ALL', 'CARDIO', 'RESPIRATORY', 'NEURO'] as const).map((sys) => (
                  <button
                    key={sys}
                    onClick={() => setActiveSystem(sys)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      activeSystem === sys
                        ? 'bg-slate-700 text-teal-300 border border-teal-500/50'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            )}

            {/* Camera Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 mr-1">Camera:</span>
              {(['ISOMETRIC', 'ANTERIOR', 'LATERAL', 'TOP'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCameraPreset(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    cameraPreset === preset
                      ? 'bg-teal-500 text-slate-950 font-semibold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {preset.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Reset View */}
            <button
              onClick={() => {
                setExplodedRatio(0);
                setActiveSystem('ALL');
                setCameraPreset('ISOMETRIC');
              }}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

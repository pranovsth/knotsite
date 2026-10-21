import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * A small, real-time sculpture. Give the wrapper a width and height; the canvas
 * deliberately has no fixed dimensions, background, or external asset requests.
 */
export default function KnotScene({ className = '', reducedMotion = false, variant = 'hero' }) {
  const hostRef = useRef(null);
  const canvasHostRef = useRef(null);
  const controlsRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [fallbackRotation, setFallbackRotation] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const canvasHost = canvasHostRef.current;
    if (!host || !canvasHost) return undefined;

    let renderer;
    let environment;
    let environmentTarget;
    let pmrem;
    let geometry;
    let material;
    let animationFrame = 0;
    let destroyed = false;
    let intersecting = true;
    let contextLost = false;
    let elapsed = 0;
    let previousTime = 0;
    let dragging = false;
    let pointerId = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let hovering = false;
    let pointerX = 0;
    let pointerY = 0;
    let currentPointerX = 0;
    let currentPointerY = 0;
    let currentScale = 1;
    const spin = { x: 0, y: 0 };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let still = reducedMotion || motionQuery.matches;
    const cleanups = [];

    setReady(false);

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
      canvasHost.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
      camera.position.set(0, 0, variant === 'hero' ? 5.5 : 5.8);

      // An actual studio environment creates broad reflections rather than a
      // painted highlight, so the surface responds naturally to every rotation.
      pmrem = new THREE.PMREMGenerator(renderer);
      environment = new RoomEnvironment();
      environmentTarget = pmrem.fromScene(environment, 0.04, 0.1, 30);
      scene.environment = environmentTarget.texture;
      environment.dispose();
      environment = null;
      pmrem.dispose();
      pmrem = null;

      const sculpture = new THREE.Group();
      scene.add(sculpture);
      geometry = new THREE.TorusKnotGeometry(0.69, 0.225, 224, 32, 2, 3);
      geometry.computeBoundingSphere();
      material = new THREE.MeshPhysicalMaterial({
        color: '#335bff',
        metalness: 0.64,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.4,
        iridescence: 0.16,
        iridescenceIOR: 1.35,
        sheen: 0.15,
        sheenColor: new THREE.Color('#cbdcff'),
      });
      const knot = new THREE.Mesh(geometry, material);
      knot.rotation.z = Math.PI / 8;
      sculpture.add(knot);

      scene.add(new THREE.HemisphereLight(0xd9e7ff, 0x0b165a, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 4);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x93baff, 3.5);
      rim.position.set(4, 0, -2);
      scene.add(rim);

      const canRender = () => !destroyed && !contextLost && intersecting && !document.hidden;
      const draw = (timestamp = performance.now()) => {
        animationFrame = 0;
        if (!canRender()) {
          previousTime = 0;
          return;
        }
        const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 1 / 60;
        previousTime = timestamp;
        if (!still && !dragging) elapsed += delta;
        const ease = still ? 1 : 1 - Math.exp(-delta * 8);
        currentPointerX += (pointerX - currentPointerX) * ease;
        currentPointerY += (pointerY - currentPointerY) * ease;
        currentScale += ((hovering ? 1.045 : 1) - currentScale) * ease;
        sculpture.rotation.set(
          0.12 + spin.x + currentPointerY * 0.2 + (still ? 0 : Math.sin(elapsed * 0.42) * 0.055),
          -0.24 + spin.y + currentPointerX * 0.26 + (still ? 0 : Math.sin(elapsed * 0.24) * 0.28),
          still ? 0 : Math.sin(elapsed * 0.32) * 0.07,
        );
        sculpture.position.y = still ? 0 : Math.sin(elapsed * 0.75) * 0.045;
        sculpture.scale.setScalar(currentScale);
        renderer.render(scene, camera);
        if (!still) animationFrame = requestAnimationFrame(draw);
      };
      const requestDraw = () => {
        if (!animationFrame && canRender()) animationFrame = requestAnimationFrame(draw);
      };
      const stopDrawing = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        previousTime = 0;
      };
      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        camera.aspect = width / height;
        // Keep the full sculpture visible in unusually narrow parent layouts.
        camera.position.z = (variant === 'hero' ? 5.5 : 5.8) / Math.min(camera.aspect, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        requestDraw();
      };

      const updatePointer = (event) => {
        const rect = host.getBoundingClientRect();
        pointerX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
        pointerY = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
      };
      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        dragging = true;
        pointerId = event.pointerId;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        host.setPointerCapture?.(event.pointerId);
        host.style.cursor = 'grabbing';
        requestDraw();
      };
      const onPointerMove = (event) => {
        updatePointer(event);
        if (dragging && event.pointerId === pointerId) {
          spin.y += (event.clientX - lastPointerX) * 0.014;
          // A touch can still scroll the page vertically.
          if (event.pointerType !== 'touch') spin.x += (event.clientY - lastPointerY) * 0.014;
          lastPointerX = event.clientX;
          lastPointerY = event.clientY;
        }
        requestDraw();
      };
      const onPointerUp = (event) => {
        if (event.pointerId !== pointerId) return;
        dragging = false;
        pointerId = null;
        if (host.hasPointerCapture?.(event.pointerId)) host.releasePointerCapture(event.pointerId);
        host.style.cursor = 'grab';
        requestDraw();
      };
      const onPointerEnter = (event) => {
        hovering = true;
        updatePointer(event);
        requestDraw();
      };
      const onPointerLeave = () => {
        hovering = false;
        pointerX = 0;
        pointerY = 0;
        requestDraw();
      };
      const onVisibilityChange = () => {
        if (document.hidden) stopDrawing();
        else requestDraw();
      };
      const onMotionChange = () => {
        still = reducedMotion || motionQuery.matches;
        stopDrawing();
        requestDraw();
      };
      const onContextLost = (event) => {
        event.preventDefault();
        contextLost = true;
        stopDrawing();
        setReady(false);
      };
      const onContextRestored = () => {
        contextLost = false;
        setReady(true);
        resize();
      };

      controlsRef.current = (keyName) => {
        if (keyName === 'Home') {
          spin.x = 0;
          spin.y = 0;
          elapsed = 0;
        } else if (keyName === 'ArrowLeft') spin.y -= 0.22;
        else if (keyName === 'ArrowRight') spin.y += 0.22;
        else if (keyName === 'ArrowUp') spin.x -= 0.22;
        else if (keyName === 'ArrowDown') spin.x += 0.22;
        requestDraw();
      };

      const listeners = [
        [host, 'pointerdown', onPointerDown],
        [host, 'pointermove', onPointerMove],
        [host, 'pointerup', onPointerUp],
        [host, 'pointercancel', onPointerUp],
        [host, 'lostpointercapture', onPointerUp],
        [host, 'pointerenter', onPointerEnter],
        [host, 'pointerleave', onPointerLeave],
        [document, 'visibilitychange', onVisibilityChange],
        [renderer.domElement, 'webglcontextlost', onContextLost],
        [renderer.domElement, 'webglcontextrestored', onContextRestored],
      ];
      listeners.forEach(([element, name, callback]) => element.addEventListener(name, callback));
      cleanups.push(() => listeners.forEach(([element, name, callback]) => element.removeEventListener(name, callback)));
      motionQuery.addEventListener('change', onMotionChange);
      cleanups.push(() => motionQuery.removeEventListener('change', onMotionChange));

      if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        cleanups.push(() => resizeObserver.disconnect());
      } else {
        window.addEventListener('resize', resize);
        cleanups.push(() => window.removeEventListener('resize', resize));
      }
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(([entry]) => {
          intersecting = entry.isIntersecting;
          if (intersecting) requestDraw();
          else stopDrawing();
        }, { rootMargin: '60px' });
        observer.observe(host);
        cleanups.push(() => observer.disconnect());
      }
      resize();
      // Paint the first frame before replacing the accessible vector fallback.
      stopDrawing();
      draw();
      setReady(true);
    } catch {
      // The vector remains useful on devices with WebGL disabled or exhausted.
      setReady(false);
    }

    return () => {
      destroyed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      cleanups.forEach((cleanup) => cleanup());
      controlsRef.current = null;
      geometry?.dispose();
      material?.dispose();
      environment?.dispose();
      environmentTarget?.dispose();
      pmrem?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, [reducedMotion, variant]);

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (controlsRef.current) controlsRef.current(event.key);
    else setFallbackRotation((rotation) => event.key === 'Home' ? 0 : rotation + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -15 : 15));
  };

  return (
    <div
      ref={hostRef}
      className={`knot-scene ${className}`.trim()}
      role="img"
      aria-label="Interactive blue knot sculpture. Drag or use the arrow keys to rotate. Press Home to reset."
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home"
      tabIndex={0}
      title="A little knot, a little play. Drag to rotate."
      onKeyDown={onKeyDown}
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'grab', touchAction: 'pan-y', borderRadius: 'inherit' }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        style={{ position: 'absolute', inset: '12%', width: '76%', height: '76%', opacity: ready ? 0 : 1, transform: `rotate(${fallbackRotation}deg)`, pointerEvents: 'none' }}
      >
        <g fill="none" stroke="#385bff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 25C65 3 91 22 75 42L33 77C13 92 1 63 24 51L70 30C94 21 99 51 77 59L26 70C3 74 7 43 30 44L76 54C99 61 83 90 65 75L28 35C12 16 39 3 49 25L65 72C74 96 43 99 40 75Z" />
        </g>
      </svg>
      <div ref={canvasHostRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0, pointerEvents: 'none' }} />
    </div>
  );
}

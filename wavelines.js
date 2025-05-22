/* waveLines.js
   Drop‑in full‑window wave animation.
   Simply include Three.js first, then this file,
   then call  startWaveLines();  when the DOM is ready.
*/
(function () {
    "use strict";
  
    // Tweak‑ables -------------------------------------------------------------
    const ROWS     = 120;
    const COLS     = 200;
    const SPACING  = 1.2;
    const AMP      = 8;
    const SPEED    = 0.0018;
  
    // Helper: make a full‑screen renderer ------------------------------------
    function createRenderer() {
      const r = new THREE.WebGLRenderer({ antialias: true });
      r.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(r.domElement);
      return r;
    }
  
    // Main entry --------------------------------------------------------------
    window.startWaveLines = function startWaveLines() {
      // Scene + camera
      const scene  = new THREE.Scene();
      const cam    = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
      cam.position.set(0, 60, 130);
      cam.lookAt(scene.position);
  
      // Renderer
      const renderer = createRenderer();
  
      // Grid of lines
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      const lines = [];
  
      for (let r = 0; r < ROWS; r++) {
        const geo   = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(COLS * 3), 3)
        );
        const line  = new THREE.Line(geo, material);
        line.position.z = (r - ROWS / 2) * SPACING;
        scene.add(line);
        lines.push(line);
      }
  
      // Resize handler -------------------------------------------------------
      function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize);
      resize(); // kick‑start
  
      // Animation loop -------------------------------------------------------
      let t = 0;
      (function animate() {
        requestAnimationFrame(animate);
        t += SPEED;
  
        lines.forEach((line, row) => {
          const pos = line.geometry.attributes.position.array;
          for (let c = 0; c < COLS; c++) {
            const x = (c - COLS / 2) * SPACING;
            const y =
              AMP *
              Math.sin(0.16 * x + t * 5) *
              Math.cos(0.13 * row + t * 3);
            const i = c * 3;
            pos[i] = x;
            pos[i + 1] = y;
            pos[i + 2] = 0;
          }
          line.geometry.attributes.position.needsUpdate = true;
        });
  
        scene.rotation.y += 0.0014;
        renderer.render(scene, cam);
      })();
    };
  })();
  
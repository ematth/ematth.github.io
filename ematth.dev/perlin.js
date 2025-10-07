// Perlin Noise logic adapted from Joseph Gentle - noisejs.github.io - MIT License
const PerlinNoise = (function() {
    const p = new Uint8Array(512);
    let permutation = [ 151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180 ];
    for (let i=0; i < 256 ; i++) p[i] = p[i+256] = permutation[i];

    function fade(t) { return t*t*t*(t*(t*6-15)+10); }
    function lerp(t, a, b) { return a + t * (b - a); }
    function grad(hash, x, y, z) {
        let h = hash & 15;
        let u = h<8 ? x : y, v = h<4 ? y : h==12||h==14 ? x : z;
        return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
    }
    return {
        noise: function(x, y, z) {
            let X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
            x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
            let u = fade(x), v = fade(y), w = fade(z);
            let A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z,
                B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;
            return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x-1, y, z)), lerp(u, grad(p[AB], x, y-1, z), grad(p[BB], x-1, y-1, z))),
                           lerp(v, lerp(u, grad(p[AA+1], x, y, z-1), grad(p[BA+1], x-1, y, z-1)), lerp(u, grad(p[AB+1], x, y-1, z-1), grad(p[BB+1], x-1, y-1, z-1))));
        }
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('perlin-canvas');
    if (!canvas) return;

    // Wait for canvas to have dimensions before initializing
    function initAnimation() {
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
            requestAnimationFrame(initAnimation);
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const group = new THREE.Group();
    scene.add(group);

    const lineCount = 120;
    const pointsPerLine = 150;
    const segmentLength = 2;
    const planeWidth = pointsPerLine * segmentLength;
    const planeDepth = 120;
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
        const points = [];
        const z = (i / lineCount) * planeDepth - planeDepth / 2;
        for (let j = 0; j < pointsPerLine; j++) {
            const x = (j / pointsPerLine) * planeWidth - planeWidth / 2;
            points.push(new THREE.Vector3(x, 0, z));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const color = new THREE.Color("#00FFFF");

        const material = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(geometry, material);
        group.add(line);
        lines.push({ line: line, originalPoints: points });
    }

    camera.position.set(0, 40, 60);
    camera.lookAt(scene.position);
    
    // Set a static rotation of 15 degrees
    group.rotation.y = 15 * (Math.PI / 180);

    let time = 0;
    const clock = new THREE.Clock();
    const interval = 1 / 20; // Target 20fps
    let delta = 0;

    function animate() {
        requestAnimationFrame(animate);

        delta += clock.getDelta();

        if (delta > interval) {
            time += 0.03;

            for (let i = 0; i < lines.length; i++) {
                const lineData = lines[i];
                const positions = lineData.line.geometry.attributes.position.array;
                for (let j = 0; j < pointsPerLine; j++) {
                    const x = lineData.originalPoints[j].x;
                    const z = lineData.originalPoints[j].z;
                    positions[j * 3 + 1] = PerlinNoise.noise(x * 0.03, z * 0.03, time) * 15;
                }
                lineData.line.geometry.attributes.position.needsUpdate = true;
            }

            renderer.render(scene, camera);

            delta %= interval;
        }
    }
    
    animate();

    function onWindowResize() {
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    }

    // Listen for window resize events
    window.addEventListener('resize', onWindowResize, false);

    // Observe the animation container to detect when iframe is resized
    if (typeof ResizeObserver !== 'undefined') {
        const animationContainer = document.getElementById('perlin-animation');
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(animationContainer);
    }
    }
    
    // Start initialization
    initAnimation();
});

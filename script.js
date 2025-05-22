// Joseph Gentle - noisejs.github.io - MIT License
// (Slightly modified to be self-contained and use a local p array)
const PerlinNoise = (function() {
    const p = new Uint8Array(512);
    let permutation = [ 151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180 ];

    function seed(val) {
        if (val > 0 && val < 1) {
            // Scale the seed out
            val *= 65536;
        }

        val = Math.floor(val);
        if (val < 256) {
            val |= val << 8;
        }

        for (let i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = permutation[i] ^ (val & 255);
            } else {
                v = permutation[i] ^ ((val >> 8) & 255);
            }
            p[i] = p[i + 256] = v;
        }
    }

    seed(0); // Default seed

    function fade(t) { return t*t*t*(t*(t*6-15)+10); }
    function lerp(t, a, b) { return a + t * (b - a); }

    function grad(hash, x, y, z) {
        var h = hash & 15;      // CONVERT LO 4 BITS OF HASH CODE
        var u = h<8 ? x : y,    // INTO 12 GRADIENT DIRECTIONS.
            v = h<4 ? y : h==12||h==14 ? x : z;
        return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
    }

    function perlin3(x, y, z) {
        var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
            Y = Math.floor(y) & 255,                  // CONTAINS POINT.
            Z = Math.floor(z) & 255;
        x -= Math.floor(x);                                // FIND RELATIVE X,Y,Z
        y -= Math.floor(y);                                // OF POINT IN CUBE.
        z -= Math.floor(z);
        var u = fade(x),                                // COMPUTE FADE CURVES
            v = fade(y),                                // FOR EACH OF X,Y,Z.
            w = fade(z);
        var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,      // HASH COORDINATES OF
            B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;      // THE 8 CUBE CORNERS

        return lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),  // AND ADD
                                       grad(p[BA  ], x-1, y  , z   )), // BLENDED
                               lerp(u, grad(p[AB  ], x  , y-1, z   ),  // RESULTS
                                       grad(p[BB  ], x-1, y-1, z   ))),// FROM  8
                       lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),  // CORNERS
                                       grad(p[BA+1], x-1, y  , z-1 )), // OF CUBE
                               lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                       grad(p[BB+1], x-1, y-1, z-1 ))));
    }

    return {
        noise3: perlin3,
        seed: seed
    };
})();

const themeToggleButton = document.getElementById('themeToggle');

let isLightMode = false;

function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    themeToggleButton.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    // Update noise visualization theme if it exists
    handleNoiseTheme();
}

themeToggleButton.addEventListener('click', () => {
    isLightMode = !isLightMode;
    applyTheme(isLightMode);
});

const preferredTheme = localStorage.getItem('theme');
if (preferredTheme === 'light') {
    isLightMode = true;
}

// --- START: Blog Preview Logic ---

async function fetchBlogSlugs() {
    try {
        const response = await fetch('blogs/manifest.json');
        if (!response.ok) {
            console.error('Failed to fetch blog manifest:', response.statusText);
            return []; // Return empty array on failure
        }
        const slugs = await response.json();
        return slugs;
    } catch (error) {
        console.error('Error fetching or parsing blog manifest:', error);
        return []; // Return empty array on error
    }
}

async function fetchBlogData(slug) {
    try {
        const response = await fetch(`blogs/${slug}/index.md`);
        if (!response.ok) {
            console.error(`Error fetching blog post ${slug}: ${response.statusText}`);
            return null;
        }
        const markdown = await response.text();

        // Basic frontmatter parsing
        const frontmatterMatch = markdown.match(/^---[\s\S]*?---/);
        let content = markdown;
        let title = slug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); // Default title
        let date = 'N/A';

        if (frontmatterMatch) {
            const frontmatterText = frontmatterMatch[0];
            content = markdown.substring(frontmatterText.length).trim();
            
            const titleMatch = frontmatterText.match(/^title:\s*(.*)$/m);
            if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();
            
            const dateMatch = frontmatterText.match(/^date:\s*(.*)$/m);
            if (dateMatch && dateMatch[1]) date = dateMatch[1].trim();
        }

        // Generate a preview (e.g., first paragraph or first ~150 chars)
        let preview = content.split('\n\n')[0]; // Get first paragraph
        if (preview.startsWith('#')) { // If first line is a heading, try next paragraph
             const lines = content.split('\n');
             let firstParaIndex = lines.findIndex(line => line.trim() !== '' && !line.startsWith('#'));
             preview = lines.slice(firstParaIndex).join('\n').split('\n\n')[0] || '';
        }
        preview = preview.replace(/^[#\s*]+/gm, ''); // Remove leading markdown like #, *, etc.
        if (preview.length > 150) {
            preview = preview.substring(0, 150) + '...';
        }
        if (!preview) preview = "Click to read more.";

        return { slug, title, date, preview };
    } catch (error) {
        console.error(`Error processing ${slug}.md:`, error);
        return null;
    }
}

async function displayBlogPreviews() {
    const previewsContainer = document.querySelector('.blog-previews');
    if (!previewsContainer) {
        console.error('Blog previews container not found.');
        return;
    }

    const blogPostSlugs = await fetchBlogSlugs(); // Fetch slugs dynamically
    if (blogPostSlugs.length === 0) {
        previewsContainer.innerHTML = '<p>No blog posts found or manifest is empty. Please check blogs/manifest.json.</p>';
        return;
    }

    const allPostsData = [];
    for (const slug of blogPostSlugs) {
        const postData = await fetchBlogData(slug);
        if (postData) {
            allPostsData.push(postData);
        }
    }

    // Sort posts by date, most recent first
    allPostsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    const postsToDisplay = allPostsData.slice(0, 4); // Get top 4

    if (postsToDisplay.length === 0) {
        previewsContainer.innerHTML = '<p>No blog posts available at the moment. Check back soon!</p>';
        return;
    }

    let previewsHTML = '';
    for (const post of postsToDisplay) {
        previewsHTML += `
            <div class="blog-preview-box">
                <h3>${post.title}</h3>
                <p class="post-meta-preview">Published on: ${post.date}</p>
                <p>${post.preview}</p>
                <a href="blog-post.html?post=${post.slug}" class="read-more">Read More</a>
            </div>
        `;
    }
    previewsContainer.innerHTML = previewsHTML;
}

// --- END: Blog Preview Logic ---

// --- START: Project Preview Logic ---

async function displayProjectPreviews() {
    const previewsContainer = document.querySelector('.project-previews');
    if (!previewsContainer) {
        console.error('Project previews container not found.');
        return;
    }

    try {
        // Load projects from the JSON file
        const response = await fetch('projects/projects.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch projects data: ${response.statusText}`);
        }
        
        const projectData = await response.json();
        // Only display the first 3 projects on the main page
        const projectsToShow = projectData.slice(0, 3);
        
        let previewsHTML = '';
        for (const project of projectsToShow) {
            let linksHTML = '';
            if (project.links && project.links.length > 0) {
                for (const link of project.links) {
                    linksHTML += `<a href="${link.url}" target="_blank" class="project-link">${link.text}</a>`;
                }
            }

            previewsHTML += `
                <div class="project-preview-box">
                    <h3>${project.title}</h3>
                    ${project.year ? `<p class="project-meta-preview"><strong>Year:</strong> ${project.year}</p>` : ''}
                    ${project.technologies ? `<p class="project-meta-preview"><strong>Technologies:</strong> ${project.technologies}</p>` : ''}
                    ${project.advisors ? `<p class="project-meta-preview"><strong>Advisor(s):</strong> ${project.advisors}</p>` : ''}
                    <p>${project.description.substring(0, 150)}${project.description.length > 150 ? '...' : ''}</p>
                    <div class="project-links-preview">
                        ${linksHTML}
                    </div>
                </div>
            `;
        }
        previewsContainer.innerHTML = previewsHTML;
    } catch (error) {
        console.error('Error loading projects:', error);
        previewsContainer.innerHTML = '<p>Failed to load projects. Please check the projects/projects.json file.</p>';
    }
}

// --- END: Project Preview Logic ---

// --- START: 3D Perlin Noise Visualization ---

let noiseScene, noiseRenderer, noiseCamera, noiseLines = [];
let noiseAnimationId;
let noiseStartTime = Date.now();
let noiseRotation = 0; // Variable to control plane rotation (in radians)
let autoRotate = true; // Set to false to disable automatic rotation
let autoRotateSpeed = 0.0005; // Speed of automatic rotation (radians per frame)

function initPerlinNoiseVisualization() {
    const canvas = document.getElementById('noiseCanvas');
    if (!canvas || typeof THREE === 'undefined') {
        console.error('Canvas element or Three.js not found');
        return;
    }

    // Get container dimensions for responsive sizing
    const container = canvas.parentElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Scene setup
    noiseScene = new THREE.Scene();
    noiseScene.background = new THREE.Color(0x0a0a0a);

    // Camera setup - positioned above and at an angle, slightly off-center (fixed position)
    const aspect = width / height;
    noiseCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    noiseCamera.position.set(5, 20, 15);
    noiseCamera.lookAt(0, 0, 0);

    // Renderer setup
    noiseRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    noiseRenderer.setSize(width, height);
    noiseRenderer.shadowMap.enabled = true;
    noiseRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a group to hold all lines for easy rotation
    const linesGroup = new THREE.Group();
    noiseScene.add(linesGroup);

    // Create parallel lines for the noise visualization
    const numLines = 50;
    const lineLength = 30;
    const lineSpacing = 0.6;
    const pointsPerLine = 100;

    for (let i = 0; i < numLines; i++) {
        const points = [];
        const z = (i - numLines / 2) * lineSpacing;
        
        for (let j = 0; j < pointsPerLine; j++) {
            const x = (j / (pointsPerLine - 1) - 0.5) * lineLength;
            points.push(new THREE.Vector3(x, 0, z));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        linesGroup.add(line);
        noiseLines.push({ line, geometry: lineGeometry, points, z });
    }

    // Store reference to the group for rotation control
    noiseLines.group = linesGroup;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    noiseScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    noiseScene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', onNoiseWindowResize);

    // Start animation
    animatePerlinNoise();
}

function onNoiseWindowResize() {
    if (!noiseCamera || !noiseRenderer) return;
    
    const container = document.getElementById('noiseCanvas').parentElement;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    noiseCamera.aspect = width / height;
    noiseCamera.updateProjectionMatrix();
    noiseRenderer.setSize(width, height);
}

function updatePerlinNoise() {
    if (noiseLines.length === 0) return;

    const time = (Date.now() - noiseStartTime) * 0.0002; // Slow time progression

    // Update each line's Y coordinates using Perlin noise
    noiseLines.forEach(lineData => {
        const { geometry, points, z } = lineData;
        const positions = geometry.attributes.position.array;

        for (let i = 0; i < points.length; i++) {
            const x = points[i].x;
            
            // Generate height using 3D Perlin noise with time component
            const height1 = PerlinNoise.noise3(x * 0.3, z * 0.3, time) * 4;
            const height2 = PerlinNoise.noise3(x * 0.1, z * 0.1, time * 0.5) * 2;
            const height3 = PerlinNoise.noise3(x * 0.6, z * 0.6, time * 2) * 1;
            
            const finalHeight = height1 + height2 + height3;
            
            // Update Y coordinate (index * 3 + 1 is the Y coordinate)
            positions[i * 3 + 1] = finalHeight;
        }

        geometry.attributes.position.needsUpdate = true;
    });
}

function animatePerlinNoise() {
    noiseAnimationId = requestAnimationFrame(animatePerlinNoise);
    
    updatePerlinNoise();
    
    // Handle automatic rotation
    if (autoRotate) {
        noiseRotation += autoRotateSpeed;
    }
    
    // Apply rotation to the lines group using the noiseRotation variable
    if (noiseLines.group) {
        noiseLines.group.rotation.y = noiseRotation;
    }
    
    noiseRenderer.render(noiseScene, noiseCamera);
}

// Helper function to manually set the rotation (in degrees for easier use)
function setNoiseRotation(degrees) {
    noiseRotation = degrees * (Math.PI / 180); // Convert degrees to radians
}

// Helper function to toggle automatic rotation
function toggleAutoRotation() {
    autoRotate = !autoRotate;
}

function handleNoiseTheme() {
    if (!noiseScene) return;
    
    // Update background color based on theme
    const isLight = document.body.classList.contains('light-mode');
    noiseScene.background = new THREE.Color(isLight ? 0xf0f0f0 : 0x0a0a0a);
    
    // Update line colors
    const lineColor = isLight ? 0x0066cc : 0x00ffff;
    noiseLines.forEach(lineData => {
        if (lineData.line && lineData.line.material) {
            lineData.line.material.color.setHex(lineColor);
        }
    });
}

function cleanupNoiseVisualization() {
    if (noiseAnimationId) {
        cancelAnimationFrame(noiseAnimationId);
    }
    if (noiseRenderer) {
        noiseRenderer.dispose();
    }
    window.removeEventListener('resize', onNoiseWindowResize);
}

// --- END: 3D Perlin Noise Visualization ---

window.addEventListener('DOMContentLoaded', () => {
    applyTheme(isLightMode); // Apply initial theme from blog-post.html, ensure it's here for index

    // Initialize 3D Perlin noise visualization if canvas exists
    if (document.getElementById('noiseCanvas')) {
        initPerlinNoiseVisualization();
        handleNoiseTheme(); // Apply initial theme to noise visualization
    }

    // Load blog previews if on the main page
    if (document.querySelector('.blog-previews')) {
        displayBlogPreviews();
    }
    
    // Load project previews if on the main page
    if (document.querySelector('.project-previews')) {
        displayProjectPreviews();
    }
}); 
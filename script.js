const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let mouseX = width / 2;
let mouseY = height / 2;

let waveformColor = 'hsl(180, 100%, 50%)'; // Initial waveform color (cyan)

const hueSlider = document.getElementById('hue');
// const speedSlider = document.getElementById('speed'); // Removed
const complexitySlider = document.getElementById('complexity');
const themeToggleButton = document.getElementById('themeToggle');

// New 3D and perspective parameters
const NUM_LINES = 50; // Total number of lines, will be split for near/far
const PERSPECTIVE_STRENGTH = 0.2; // How quickly lines converge
const VERTICAL_TILT_FACTOR = 15; // How much lines shift vertically with depth
const LINE_SPACING_Z = 1.0; 

// Lightness parameters for depth - more drastic range
let currentMinLightness = 7; 
let currentMaxLightness = 90; 
let currentMidLightness = 50; 

// Default dark mode values (will be overwritten if light mode is set)
const DARK_MODE_MIN_LIGHTNESS = 7;
const DARK_MODE_MAX_LIGHTNESS = 90;
const DARK_MODE_MID_LIGHTNESS = 50;

const LIGHT_MODE_MIN_LIGHTNESS = 93; // For far lines to blend with light bg (e.g. #f0f0f0 which is ~94% lightness)
const LIGHT_MODE_MAX_LIGHTNESS = 20; // For near lines to be dark
const LIGHT_MODE_MID_LIGHTNESS = 60; // Mid-point for light mode

const MAX_ABS_NEAR_Z_IDX = 0; // Limit how close lines can get (max absolute value for negative z_idx)
const VERTICAL_VIEW_OFFSET = 150; // Positive values shift the entire wave formation down

// Mouse influence parameters
const HOVER_MOUSE_INFLUENCE = 0.4; // Gentle pull on hover - NO LONGER USED FOR PULL, BUMP INSTEAD
const CLICK_MOUSE_INFLUENCE = 1.0; // Stronger pull on click - REDUCED FROM 1.2 to 1.0 for smoothness
const HOVER_BUMP_AMPLITUDE = 30;  // Max height of the bump on hover (in world units)

let currentSpeedFactor = 2.75; // Fixed high speed (was: 1.0; slider went -4.0 to 4.0)
let currentComplexityFactor = 0.5; // Default complexity (0 to 1 initially, now 0 to 2)
let isMouseDown = false;
let isWaveFrozen = false;
let frozenMouseX = 0;
let frozenMouseY = 0;
let isLightMode = false;

function setLightnessParams(isLight) {
    if (isLight) {
        currentMinLightness = LIGHT_MODE_MIN_LIGHTNESS;
        currentMaxLightness = LIGHT_MODE_MAX_LIGHTNESS;
        currentMidLightness = LIGHT_MODE_MID_LIGHTNESS;
    } else {
        currentMinLightness = DARK_MODE_MIN_LIGHTNESS;
        currentMaxLightness = DARK_MODE_MAX_LIGHTNESS;
        currentMidLightness = DARK_MODE_MID_LIGHTNESS;
    }
}

function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    themeToggleButton.textContent = isLight ? '☀️' : '🌙';
    setLightnessParams(isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

themeToggleButton.addEventListener('click', () => {
    isLightMode = !isLightMode;
    applyTheme(isLightMode);
});

// Load theme preference on start
const preferredTheme = localStorage.getItem('theme');
if (preferredTheme === 'light') {
    isLightMode = true;
}
applyTheme(isLightMode); // Apply initial theme

function updateWaveformColor() {
    const hue = hueSlider.value;
    // Using HSL color: Saturation 100%, Lightness 50% for vibrant colors
    waveformColor = `hsl(${hue}, 100%, 50%)`;
}

hueSlider.addEventListener('input', updateWaveformColor);

// speedSlider.addEventListener('input', () => { // Removed
//     currentSpeedFactor = speedSlider.value / 100; 
// });

complexitySlider.addEventListener('input', () => {
    currentComplexityFactor = complexitySlider.value / 100; // Convert 0-200 to 0-2.0
});

// Initialize color based on initial slider values
updateWaveformColor();

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) { 
        isMouseDown = true;
        isWaveFrozen = false; // New drag unfreezes
    }
});

window.addEventListener('mouseup', (event) => {
    if (event.button === 0) { 
        if (isMouseDown) { // Only freeze if it was a drag/click release
            isWaveFrozen = true;
            frozenMouseX = mouseX;
            frozenMouseY = mouseY;
        }
        isMouseDown = false;
    }
});

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);

    const time = performance.now() * 0.001 * currentSpeedFactor;
    const baseAmplitude = 50;
    const baseFrequency = 0.01;
    const currentHue = hueSlider.value;

    const halfLines = Math.floor(NUM_LINES / 2);

    for (let z_idx = halfLines; z_idx >= -MAX_ABS_NEAR_Z_IDX; z_idx--) {
        const z_world = z_idx * LINE_SPACING_Z;
        const perspectiveScale = 1 / (1 + z_world * PERSPECTIVE_STRENGTH);

        // Calculate lightness based on depth and mode
        let lightness;
        if (z_idx === 0) {
            lightness = currentMidLightness;
        } else if (z_idx > 0) { // Farther lines
            const ratio = z_idx / halfLines;
            // In light mode, far lines are lighter (currentMinLightness is high)
            // In dark mode, far lines are darker (currentMinLightness is low)
            lightness = currentMidLightness - ratio * (currentMidLightness - currentMinLightness);
        } else { // z_idx < 0 (Nearer lines)
            const ratio = Math.abs(z_idx) / MAX_ABS_NEAR_Z_IDX;
            // In light mode, near lines are darker (currentMaxLightness is low)
            // In dark mode, near lines are brighter (currentMaxLightness is high)
            lightness = currentMidLightness + ratio * (currentMaxLightness - currentMidLightness);
        }
        lightness = Math.max(0, Math.min(100, Math.round(lightness)));

        ctx.beginPath();
        ctx.strokeStyle = `hsl(${currentHue}, 100%, ${lightness}%)`;

        const currentAmplitude = baseAmplitude * perspectiveScale;
        const currentLineWidth = Math.max(0.5, 2 * perspectiveScale);
        ctx.lineWidth = currentLineWidth;
        
        const screenY_center_offset = height / 2 - z_world * VERTICAL_TILT_FACTOR + VERTICAL_VIEW_OFFSET;

        // Calculate initial Y for this line at sx=0 (screen space)
        let sx_start = 0;
        let x_world_at_sx_start = (sx_start - width / 2) / perspectiveScale;

        const wave1Y_x0 = Math.sin(x_world_at_sx_start * baseFrequency / perspectiveScale + time) * currentAmplitude;
        const wave2AmpFactor = currentComplexityFactor * 1.5; 
        const wave3AmpFactor = currentComplexityFactor * 1.2; 
        const wave2FreqFactor = 1 + (currentComplexityFactor - 0.5) * 0.8; 
        const wave3FreqFactor = 1 - (currentComplexityFactor - 0.5) * 0.4;
        const wave2Y_x0 = Math.sin(x_world_at_sx_start * baseFrequency * 2.5 * wave2FreqFactor / perspectiveScale + time * 0.8) * (currentAmplitude / 3) * wave2AmpFactor;
        const wave3Y_x0 = Math.sin(x_world_at_sx_start * baseFrequency * 0.5 * wave3FreqFactor / perspectiveScale + time * 0.5) * (currentAmplitude * 0.7) * wave3AmpFactor;
        const combinedWaveY_x0 = wave1Y_x0 + wave2Y_x0 + wave3Y_x0;
        
        let targetY_x0_world = combinedWaveY_x0;
        
        const mouseX_at_depth = (mouseX - width / 2) / perspectiveScale; // Live mouse X for hover/active drag
        const influenceRadiusBaseScreen = width / 3; // WIDENED from width / 4
        const worldInfluenceWidth = influenceRadiusBaseScreen / perspectiveScale;
        const influenceRadius = Math.pow(worldInfluenceWidth, 2);
        
        // --- For y_world_start (initial point of the line) ---
        let y_calc_target_y0 = targetY_x0_world;
        let final_y_world_start = y_calc_target_y0;

        if (isWaveFrozen) {
            const frozenMouseX_world = (frozenMouseX - width / 2) / perspectiveScale;
            const distSqToFrozen_x0 = Math.pow(x_world_at_sx_start - frozenMouseX_world, 2);
            const frozenInfluenceFactor_x0 = Math.exp(-distSqToFrozen_x0 / (2 * influenceRadius));
            const frozenMouseY_world_displacement = (frozenMouseY - height / 2) / perspectiveScale; // Mouse Y displacement from center in world units
            final_y_world_start = y_calc_target_y0 + frozenMouseY_world_displacement * frozenInfluenceFactor_x0 * CLICK_MOUSE_INFLUENCE;
        }

        if (isMouseDown) { // Active drag (isWaveFrozen is false here due to mousedown logic)
            const liveInfluenceFactor_x0 = Math.exp(-Math.pow(x_world_at_sx_start - mouseX_at_depth, 2) / (2 * influenceRadius));
            const mouseY_world_displacement = (mouseY - height / 2) / perspectiveScale; // Mouse Y displacement from center in world units
            final_y_world_start = y_calc_target_y0 + mouseY_world_displacement * liveInfluenceFactor_x0 * CLICK_MOUSE_INFLUENCE;
        } else { // Hovering (potentially on top of a frozen wave)
            const liveInfluenceFactor_x0 = Math.exp(-Math.pow(x_world_at_sx_start - mouseX_at_depth, 2) / (2 * influenceRadius));
            const bumpDisplacement_x0 = HOVER_BUMP_AMPLITUDE * liveInfluenceFactor_x0;
            final_y_world_start += bumpDisplacement_x0;
        }
        y_world_start = final_y_world_start;

        let screenY_start = y_world_start * perspectiveScale + screenY_center_offset;
        ctx.moveTo(sx_start, screenY_start); // Use sx_start (which is 0)

        for (let sx = 1; sx < width; sx++) { // Start loop from 1 as sx=0 is moveTo
            let x_world = (sx - width / 2) / perspectiveScale;

            const wave1Y = Math.sin(x_world * baseFrequency / perspectiveScale + time) * currentAmplitude;
            const wave2Y = Math.sin(x_world * baseFrequency * 2.5 * wave2FreqFactor / perspectiveScale + time * 0.8) * (currentAmplitude / 3) * wave2AmpFactor;
            const wave3Y = Math.sin(x_world * baseFrequency * 0.5 * wave3FreqFactor / perspectiveScale + time * 0.5) * (currentAmplitude * 0.7) * wave3AmpFactor;
            const combinedWaveY = wave1Y + wave2Y + wave3Y;
            let targetY_world = combinedWaveY;

            // --- For y_world (points along the line) ---
            let y_calc_target_y = targetY_world;
            let final_y_world = y_calc_target_y;

            if (isWaveFrozen) {
                const frozenMouseX_world = (frozenMouseX - width / 2) / perspectiveScale;
                const distSqToFrozen = Math.pow(x_world - frozenMouseX_world, 2); 
                const frozenInfluenceFactor = Math.exp(-distSqToFrozen / (2 * influenceRadius));
                const frozenMouseY_world_displacement = (frozenMouseY - height / 2) / perspectiveScale; // Mouse Y displacement from center in world units
                final_y_world = y_calc_target_y + frozenMouseY_world_displacement * frozenInfluenceFactor * CLICK_MOUSE_INFLUENCE;
            }

            if (isMouseDown) { // Active drag
                const liveInfluenceFactor = Math.exp(-Math.pow(x_world - mouseX_at_depth, 2) / (2 * influenceRadius));
                const mouseY_world_displacement = (mouseY - height / 2) / perspectiveScale; // Mouse Y displacement from center in world units
                final_y_world = y_calc_target_y + mouseY_world_displacement * liveInfluenceFactor * CLICK_MOUSE_INFLUENCE;
            } else { // Hovering
                const liveInfluenceFactor = Math.exp(-Math.pow(x_world - mouseX_at_depth, 2) / (2 * influenceRadius));
                const bumpDisplacement = HOVER_BUMP_AMPLITUDE * liveInfluenceFactor;
                final_y_world += bumpDisplacement;
            }
            y_world = final_y_world;

            // Project to screen space
            let screenY = y_world * perspectiveScale + screenY_center_offset;
            ctx.lineTo(sx, screenY);
        }
        ctx.stroke();
    }
}

animate(); 

// --- START: New Blog Preview Logic ---

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
        const response = await fetch(`blogs/${slug}.md`);
        if (!response.ok) {
            console.error(`Failed to fetch ${slug}.md: ${response.statusText}`);
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

// --- END: New Blog Preview Logic ---

window.addEventListener('DOMContentLoaded', () => {
    applyTheme(isLightMode); // Apply initial theme from blog-post.html, ensure it's here for index
    updateWaveformColor(); // Initialize color based on initial slider values
    animate(); // Start the waveform animation

    // Load blog previews if on the main page
    if (document.querySelector('.blog-previews')) {
        displayBlogPreviews();
    }
}); 
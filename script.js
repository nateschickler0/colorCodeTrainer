// ColorSandbox initialization
const initH = Math.floor(Math.random() * 360);
const initS = Math.floor(Math.random() * 20) + 70; // 70-90% Saturation
const initL = Math.floor(Math.random() * 15) + 75; // 75-90% Lightness
const [initR, initG, initB] = hsl2rgb(initH, initS / 100, initL / 100).map(x => Math.round(x * 255));

const colorSandbox = new ColorSandbox(initR, initG, initB);
// Ensure strict HSL values are set to avoid rounding differences from RGB conversion
colorSandbox.updateSandboxColor(initR, initG, initB, initH, initS, initL);

// Set up 2D picker interaction
const slPicker = $("#slPicker");
let isDragging = false;

slPicker.addEventListener("mousedown", (e) => {
    isDragging = true;
    colorSandbox.handlePickerInteraction(e);
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        colorSandbox.handlePickerInteraction(e);
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

// Touch support for mobile
slPicker.addEventListener("touchstart", (e) => {
    e.preventDefault();
    colorSandbox.handlePickerInteraction(e.touches[0]);
});

slPicker.addEventListener("touchmove", (e) => {
    e.preventDefault();
    colorSandbox.handlePickerInteraction(e.touches[0]);
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize to update nearby colors grid
window.addEventListener("resize", debounce(() => {
    // Only update if colorSandbox is initialized
    if (typeof colorSandbox !== "undefined") {
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);

        // We simply re-run the calculation with current values
        // This will read the new container width and generate correct number of tiles
        colorSandbox.updateNearbyColors(h, s, l);
    }
}, 200));

// --- Training Mode Integration ---

const colorTrainer = new ColorTrainer();
colorTrainer.init();

function switchMode(mode) {
    // Update active button state
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));

    // Map mode to button ID
    let btnId = 'modeSandbox';
    if (mode === 'code-to-swatch') btnId = 'modeCodeFromSwatches';
    else if (mode === 'swatch-to-code') btnId = 'modeSwatchToCode';
    else if (mode === 'channel-isolation') btnId = 'modeChannelIsolation';

    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');

    // Show/Hide sections
    const sandboxUI = document.getElementById('sandboxUI');
    const trainingStats = document.getElementById('trainingStats');

    if (mode === 'sandbox') {
        sandboxUI.classList.remove('hidden');
        trainingStats.classList.add('hidden');
        colorTrainer.updateUIForMode(); // Hides all training UIs
    } else {
        sandboxUI.classList.add('hidden');
        trainingStats.classList.remove('hidden');
        colorTrainer.setMode(mode);
    }
}

// Event listeners for Swatch to Code mode
document.getElementById('submitCode').onclick = () => {
    const result = colorTrainer.submitCodeGuess();

    const feedback = document.getElementById('distanceFeedback');
    feedback.classList.remove('hidden');
    feedback.textContent = result.msg;
    feedback.style.borderColor = result.correct ? '#22c55e' : '#ef4444';

    feedback.style.borderColor = result.correct ? '#22c55e' : '#ef4444';

    // Hide Submit Button
    document.getElementById('submitCode').classList.add('hidden');

    // Show Next Button
    document.getElementById('nextSwatchToCode').classList.remove('hidden');
};

document.getElementById('nextSwatchToCode').onclick = () => {
    colorTrainer.resetRound();
};

// Event listeners for Channel Isolation mode
document.getElementById('submitChannel').onclick = () => {
    const result = colorTrainer.submitChannelGuess();

    const feedback = document.getElementById('channelFeedback');
    feedback.classList.remove('hidden');
    feedback.textContent = result.msg;
    feedback.style.borderColor = result.correct ? '#22c55e' : (result.roundOver ? '#ef4444' : '#f59e0b');

    // Hide Submit Button only if round is over
    if (result.roundOver) {
        document.getElementById('submitChannel').classList.add('hidden');
        // Show Next Button
        document.getElementById('nextChannel').classList.remove('hidden');
    }
};

document.getElementById('nextChannel').onclick = () => {
    colorTrainer.resetRound();
};

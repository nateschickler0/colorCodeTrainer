class ColorTrainer {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.currentMode = null; // 'code-to-swatch', 'swatch-to-code', 'channel-isolation'
        this.targetColor = null; // {h, s, l, r, g, b}
        this.options = []; // For multiple choice
        this.currentRetries = 0;

        // Load max streaks from local storage
        try {
            this.maxStreaks = JSON.parse(localStorage.getItem('colorTrainerMaxStreaks') || '{}');
        } catch (e) {
            console.error('Failed to parse max streaks', e);
            this.maxStreaks = {};
        }

        // Bind methods
        this.handleOptionClick = this.handleOptionClick.bind(this);
        this.submitCodeGuess = this.submitCodeGuess.bind(this);
        this.submitChannelGuess = this.submitChannelGuess.bind(this);
    }

    init() {
        this.updateStatsDisplay();
    }

    setMode(mode) {
        this.currentMode = mode;
        this.streak = 0; // Reset streak on mode change
        this.resetRound();
        this.updateUIForMode();
    }

    resetRound() {
        this.generateTargetColor();

        // Reset retries based on input
        if (this.currentMode === 'channel-isolation') {
            const retryInput = document.getElementById('channelGameRetries');
            this.currentRetries = retryInput ? parseInt(retryInput.value) || 0 : 0;
        } else {
            const retryInput = document.getElementById('swatchGameRetries');
            this.currentRetries = retryInput ? parseInt(retryInput.value) || 0 : 0;
        }

        if (this.currentMode === 'code-to-swatch') {
            this.generateOptions();
        } else if (this.currentMode === 'channel-isolation') {
            this.prepareChannelChallenge();
        }

        this.renderRound();
    }

    generateTargetColor() {
        // Generate a random color, avoiding extremely dark/light/desaturated colors for better visibility
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 60) + 40; // 40-100%
        const l = Math.floor(Math.random() * 50) + 25; // 25-75%

        const [r, g, b] = hsl2rgb(h, s / 100, l / 100).map(x => Math.round(x * 255));

        this.targetColor = { h, s, l, r, g, b };
    }

    // --- Mode 1: Code to Swatch (Multiple Choice) ---

    generateOptions() {
        this.options = [];
        // Add correct answer
        this.options.push({ ...this.targetColor, isCorrect: true });

        // Generate 3-5 distractors
        const numDistractors = 3;
        for (let i = 0; i < numDistractors; i++) {
            this.options.push(this.generateDistractor());
        }

        // Shuffle options
        this.options.sort(() => Math.random() - 0.5);
    }

    generateDistractor() {
        // Create a color that is somewhat similar but distinct
        const hOffset = (Math.random() * 120 - 60); // +/- 60 deg
        const newH = (this.targetColor.h + hOffset + 360) % 360;

        const sOffset = (Math.random() * 40 - 20);
        const newS = Math.max(10, Math.min(95, this.targetColor.s + sOffset));

        const lOffset = (Math.random() * 40 - 20);
        const newL = Math.max(15, Math.min(85, this.targetColor.l + lOffset));

        const [r, g, b] = hsl2rgb(newH, newS / 100, newL / 100).map(x => Math.round(x * 255));

        return { h: newH, s: newS, l: newL, r, g, b, isCorrect: false };
    }

    handleOptionClick(clickedOption, element) {
        // Prevent clicking if already solved or failed and waiting for reset
        if (element.classList.contains('correct') || element.classList.contains('wrong') || element.classList.contains('disabled')) return;

        if (clickedOption.isCorrect) {
            this.handleSuccess(element);
        } else {
            if (this.currentRetries > 0) {
                // Retry allowed
                this.currentRetries--;
                element.classList.add('wrong');
                // Optional: visual shake or "Try again" message could be added here
            } else {
                // No retries left - Fail
                this.handleFailure(element);
            }
        }
    }

    // --- Mode 2: Swatch to Code (Sliders) ---

    updateSwatchToCodeSliders() {
        const format = document.getElementById('codeFormat').value;
        const labels = ['R', 'G', 'B'];
        const maxes = [255, 255, 255];

        if (format === 'hsl') {
            labels[0] = 'H'; maxes[0] = 360;
            labels[1] = 'S'; maxes[1] = 100;
            labels[2] = 'L'; maxes[2] = 100;
        }

        for (let i = 1; i <= 3; i++) {
            const slider = document.getElementById(`stcSlider${i}`);
            const label = document.getElementById(`stcLabel${i}`);
            const disp = document.getElementById(`stcValue${i}`);

            label.innerText = labels[i - 1];
            slider.max = maxes[i - 1];
            // Reset value slightly random or to center to avoid giving it away
            const mid = Math.floor(maxes[i - 1] / 2);
            slider.value = mid;
            disp.innerText = mid;
        }
    }

    submitCodeGuess(unusedInput, unusedType) {
        // Read from sliders
        const format = document.getElementById('codeFormat').value;
        const v1 = parseInt(document.getElementById('stcSlider1').value);
        const v2 = parseInt(document.getElementById('stcSlider2').value);
        const v3 = parseInt(document.getElementById('stcSlider3').value);

        let guessColor = { r: 0, g: 0, b: 0 };
        let isCorrect = false;
        let distance = 0;
        let feedback = "";

        if (format === 'rgb') {
            guessColor = { r: v1, g: v2, b: v3 };
            distance = this.calculateRgbDistance(this.targetColor, guessColor);
            // Tolerance: 10% of max possible distance (sqrt(255^2 * 3) ≈ 441) -> ~44
            isCorrect = distance < 45;

            if (!isCorrect) {
                feedback = `Not quite! (Dist: ${Math.round(distance)})`;
            }
        } else {
            // HSL
            const h = v1, s = v2, l = v3;
            // Convert to RGB for distance check
            const [r, g, b] = hsl2rgb(h, s / 100, l / 100).map(x => Math.round(x * 255));
            guessColor = { r, g, b };
            distance = this.calculateRgbDistance(this.targetColor, guessColor);
            // Tolerance: Same distance check
            isCorrect = distance < 45;
            if (!isCorrect) {
                feedback = `Not quite! (Dist: ${Math.round(distance)})`;
            }
        }

        if (isCorrect) {
            this.handleSuccess();
            return { valid: true, correct: true, msg: "Close enough! Great job!" };
        } else {
            this.handleFailure();
            return { valid: true, correct: false, msg: feedback + ` Actual: ${this.getActualString(format)}` };
        }
    }

    getActualString(format) {
        if (format === 'rgb') return `rgb(${this.targetColor.r}, ${this.targetColor.g}, ${this.targetColor.b})`;
        return `hsl(${this.targetColor.h}, ${this.targetColor.s}%, ${this.targetColor.l}%)`;
    }

    parseHex(hex) {
        // Deprecated for this mode but kept for utility if needed
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        if (hex.length !== 6) return null;

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return { r, g, b };
    }

    calculateRgbDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }

    // --- Mode 3: Channel Isolation ---

    prepareChannelChallenge() {
        // Randomly pick a channel to ask about based on format
        const formatSelect = document.getElementById('channelGameFormat');
        const format = formatSelect ? formatSelect.value : 'mixed';

        let channels = [];
        if (format === 'rgb') {
            channels = ['Red', 'Green', 'Blue'];
        } else if (format === 'hsl') {
            channels = ['Hue', 'Saturation', 'Lightness'];
        } else if (format === 'red') {
            channels = ['Red'];
        } else if (format === 'green') {
            channels = ['Green'];
        } else if (format === 'blue') {
            channels = ['Blue'];
        } else if (format === 'hue') {
            channels = ['Hue'];
        } else if (format === 'saturation') {
            channels = ['Saturation'];
        } else if (format === 'lightness') {
            channels = ['Lightness'];
        } else {
            channels = ['Red', 'Green', 'Blue', 'Hue', 'Saturation', 'Lightness'];
        }

        this.currentChannel = channels[Math.floor(Math.random() * channels.length)];
    }

    submitChannelGuess(value) {
        // Read slider value directly from DOM in handle, or passed in
        const guess = parseInt(document.getElementById('channelSlider').value);

        let actual = 0;
        let max = 0;

        switch (this.currentChannel) {
            case 'Red': actual = this.targetColor.r; max = 255; break;
            case 'Green': actual = this.targetColor.g; max = 255; break;
            case 'Blue': actual = this.targetColor.b; max = 255; break;
            case 'Hue': actual = Math.round(this.targetColor.h); max = 360; break;
            case 'Saturation': actual = Math.round(this.targetColor.s); max = 100; break;
            case 'Lightness': actual = Math.round(this.targetColor.l); max = 100; break;
        }

        // Allowed error: 10% of range
        const tolerance = max * 0.10;
        const diff = Math.abs(guess - actual);

        // Special handling for Hue wraparound if close to 0/360? 
        // For simplicity, strict linear diff for now, unless hue
        let isCorrect = diff <= tolerance;
        if (this.currentChannel === 'Hue') {
            // Handle 355 vs 5 => diff 350, but actual dist is 10
            const hueDiff = Math.min(Math.abs(guess - actual), 360 - Math.abs(guess - actual));
            isCorrect = hueDiff <= tolerance;
        }

        if (isCorrect) {
            this.handleSuccess();
            return { correct: true, roundOver: true, msg: `Correct! Actual was ${actual}`, actual };
        } else {
            if (this.currentRetries > 0) {
                this.currentRetries--;
                // Give a hint?
                const hint = guess < actual ? "Too low" : "Too high";
                return { correct: false, roundOver: false, msg: `Incorrect (${hint}). Try again!` };
            } else {
                this.handleFailure();
                return { correct: false, roundOver: true, msg: `Too far. Actual was ${actual}`, actual };
            }
        }
    }

    // --- Common Game Logic ---

    handleSuccess(element) {
        this.score += 10 + (this.streak * 2);
        this.streak++;

        const currentMax = this.maxStreaks[this.currentMode] || 0;
        if (this.streak > currentMax) {
            this.maxStreaks[this.currentMode] = this.streak;
            localStorage.setItem('colorTrainerMaxStreaks', JSON.stringify(this.maxStreaks));
        }

        this.updateStatsDisplay();

        // Visual feedback
        if (element) {
            // Multiple Choice Mode - Auto reset
            element.classList.add('correct');
            setTimeout(() => {
                this.resetRound();
            }, 800);
        }
        // For other modes, we DO NOT auto-reset. The user must click "Next Color".
    }

    handleFailure(element) {
        this.streak = 0;
        this.updateStatsDisplay();

        if (element) {
            element.classList.add('wrong');

            // Reveal the correct one
            const correctBtn = Array.from(document.querySelectorAll('.training-swatch-option')).find(btn => {
                // Hacky way to find it: check background color or store ref? 
                // Better: iterate options and match
                return btn.onclick && btn.onclick.toString().includes('isCorrect') === false; // Hard to inspect closure
                // Actually, we can just look at the DOM elements if we marked them or just iterate match
            });

            // Better approach: Find the option that matches targetColor
            const options = document.getElementById('swatchOptions').children;
            for (let btn of options) {
                // We can check the background style
                // But simpler: we know the index is not easy.
                // Let's rely on the generate logic to maybe mark it? 
                // Or just compare rgb values.
                const style = btn.style.background; // "rgb(r, g, b)"
                const target = `rgb(${this.targetColor.r}, ${this.targetColor.g}, ${this.targetColor.b})`;
                // whitespace might differ
                if (style.replace(/\s+/g, '') === target.replace(/\s+/g, '')) {
                    btn.classList.add('correct-reveal');
                }
            }

            // Allow them to see what was right
            setTimeout(() => {
                this.resetRound();
            }, 2000); // 2 seconds to see correct answer
        }
    }

    updateStatsDisplay() {
        const scoreEl = document.getElementById('score');
        const streakEl = document.getElementById('streak');
        const maxStreakEl = document.getElementById('maxStreak');

        if (scoreEl) scoreEl.textContent = this.score;
        if (streakEl) streakEl.textContent = this.streak;
        if (maxStreakEl) maxStreakEl.textContent = this.maxStreaks[this.currentMode] || 0;
    }

    updateUIForMode() {
        // Toggle visibility of sections based on currentMode
        ['codeFromSwatchesUI', 'swatchToCodeUI', 'channelIsolationUI'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        if (this.currentMode === 'code-to-swatch') {
            document.getElementById('codeFromSwatchesUI').classList.remove('hidden');
        } else if (this.currentMode === 'swatch-to-code') {
            document.getElementById('swatchToCodeUI').classList.remove('hidden');
        } else if (this.currentMode === 'channel-isolation') {
            document.getElementById('channelIsolationUI').classList.remove('hidden');
        }
    }

    renderRound() {
        if (this.currentMode === 'code-to-swatch') {
            this.renderCodeToSwatch();
        } else if (this.currentMode === 'swatch-to-code') {
            this.renderSwatchToCode();
        } else if (this.currentMode === 'channel-isolation') {
            this.renderChannelIsolation();
        }
    }

    renderCodeToSwatch() {
        // Display target code (pick random format)
        // Display target code based on selection
        const modeSelect = document.getElementById('swatchGameFormat');
        let format = modeSelect ? modeSelect.value : 'mixed';

        if (format === 'mixed') {
            format = Math.random() > 0.5 ? 'hex' : (Math.random() > 0.5 ? 'rgb' : 'hsl');
        }

        let codeStr = '';
        if (format === 'hex') {
            codeStr = rgb2hex265(this.targetColor.r, this.targetColor.g, this.targetColor.b);
        } else if (format === 'hsl') {
            codeStr = `hsl(${this.targetColor.h}, ${this.targetColor.s}%, ${this.targetColor.l}%)`;
        } else {
            codeStr = `rgb(${this.targetColor.r}, ${this.targetColor.g}, ${this.targetColor.b})`;
        }

        document.getElementById('targetCodeDisplay').innerHTML = codeStr;

        const container = document.getElementById('swatchOptions');
        container.innerHTML = '';

        this.options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'training-swatch-option';
            btn.style.background = `rgb(${opt.r},${opt.g},${opt.b})`;
            btn.onclick = () => this.handleOptionClick(opt, btn);
            container.appendChild(btn);
        });
    }

    renderSwatchToCode() {
        const swatch = document.getElementById('targetSwatch');
        swatch.style.background = `rgb(${this.targetColor.r},${this.targetColor.g},${this.targetColor.b})`;

        // Clear feedback
        document.getElementById('distanceFeedback').classList.add('hidden');
        document.getElementById('distanceFeedback').innerHTML = '';

        // Hide Next Button
        document.getElementById('nextSwatchToCode').classList.add('hidden');
        // Show Submit Button
        document.getElementById('submitCode').classList.remove('hidden');

        // Reset sliders
        this.updateSwatchToCodeSliders();
    }

    renderChannelIsolation() {
        const swatch = document.getElementById('channelTargetSwatch');
        swatch.style.background = `rgb(${this.targetColor.r},${this.targetColor.g},${this.targetColor.b})`;

        document.getElementById('channelQuestion').innerHTML = `Guess the <strong>${this.currentChannel}</strong> value`;

        const slider = document.getElementById('channelSlider');
        const display = document.getElementById('channelValue');

        let max = 255;
        if (this.currentChannel === 'Hue') max = 360;
        else if (this.currentChannel === 'Saturation' || this.currentChannel === 'Lightness') max = 100;

        slider.max = max;
        // Random start pos to avoid hinting
        const startVal = Math.floor(Math.random() * max);
        slider.value = startVal;
        display.innerText = startVal;

        document.getElementById('channelFeedback').classList.add('hidden');
        // Hide Next Button
        document.getElementById('nextChannel').classList.add('hidden');
        // Show Submit Button
        document.getElementById('submitChannel').classList.remove('hidden');
    }
}

/**
 * HarmonyExplorer.js - Color Harmony Explorer mixin
 * Methods for the color harmony wheel and swatch generation
 */

const HarmonyExplorerMixin = {
    /**
     * Initialize the harmony wheel canvas and event listeners
     */
    initHarmonyWheel() {
        // Defer to ensure DOM is ready if needed, though constructor is usually called after DOM
        setTimeout(() => {
            const canvas = $("#harmonyWheel");
            if (!canvas) return;

            this.wheelCtx = canvas.getContext("2d");
            this.wheelCanvas = canvas;
            this.isDraggingWheel = false;

            // Event Listeners
            const startDrag = (e) => {
                this.isDraggingWheel = true;
                this.handleWheelInteraction(e);
            };
            const moveDrag = (e) => {
                if (this.isDraggingWheel) {
                    e.preventDefault(); // Prevent scrolling on mobile
                    this.handleWheelInteraction(e);
                }
            };
            const endDrag = () => {
                this.isDraggingWheel = false;
            };

            canvas.addEventListener("mousedown", startDrag);
            document.addEventListener("mousemove", moveDrag);
            document.addEventListener("mouseup", endDrag);

            const startTouch = (e) => {
                if (e.cancelable) e.preventDefault();
                this.isDraggingWheel = true;
                this.handleWheelInteraction(e.touches[0]);
            };
            const moveTouch = (e) => {
                if (this.isDraggingWheel) {
                    if (e.cancelable) e.preventDefault(); // Prevent scrolling ONLY when dragging wheel
                    // e.preventDefault() is required on touchmove to prevent default scroll
                    this.handleWheelInteraction(e.touches[0]);
                }
            };

            // Touch events - use passive: false to allow preventDefault
            canvas.addEventListener("touchstart", startTouch, { passive: false });
            document.addEventListener("touchmove", moveTouch, { passive: false });
            document.addEventListener("touchend", endDrag);

            // Initial draw
            this.drawColorWheel();

            // Trigger update to draw indicators
            const h = parseInt($("#valHue").innerHTML) || 0;
            const s = parseInt($("#valSat").innerHTML) || 100;
            const l = parseInt($("#valLight").innerHTML) || 50;
            this.updateHarmonyExplorer(h, s, l);
        }, 0);
    },

    /**
     * Sets the Harmony Explorer mode
     */
    setHarmonyMode(mode) {
        this.harmonyMode = mode;
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);
        this.updateHarmonyExplorer(h, s, l);
    },

    /**
     * Updates the Color Harmony Explorer section
     */
    updateHarmonyExplorer(h, s, l) {
        // Ensure inputs are numbers
        h = parseInt(h);
        s = parseInt(s);
        l = parseInt(l);

        const container = $("#harmonyContainer");
        if (!container) return;
        container.innerHTML = '';

        const descriptionEl = $("#harmonyDescription");
        let description = "";

        let harmonies = [];

        switch (this.harmonyMode) {
            case 'complementary':
                description = "Two colors opposite each other on the color wheel. High contrast and high impact.";
                harmonies = [
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: (h + 180) % 360, s: s, l: l, label: 'Complement' }
                ];
                break;
            case 'analogous':
                description = "Colors that are next to each other on the color wheel. Serene and comfortable designs.";
                harmonies = [
                    { h: (h - 30 + 360) % 360, s: s, l: l, label: '-30°' },
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: (h + 30) % 360, s: s, l: l, label: '+30°' }
                ];
                break;
            case 'triadic':
                description = "Three colors evenly spaced on the color wheel. Vibrant even if you use pale versions.";
                harmonies = [
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: (h + 120) % 360, s: s, l: l, label: '+120°' },
                    { h: (h + 240) % 360, s: s, l: l, label: '+240°' }
                ];
                break;
            case 'tetradic':
                description = "Four colors arranged into two complementary pairs. Offers plenty of possibilities for variation.";
                harmonies = [
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: (h + 90) % 360, s: s, l: l, label: '+90°' },
                    { h: (h + 180) % 360, s: s, l: l, label: '+180°' },
                    { h: (h + 270) % 360, s: s, l: l, label: '+270°' }
                ];
                break;
            case 'split-complementary':
                description = "A variation of the complementary color scheme. In addition to the base color, it uses the two colors adjacent to its complement.";
                harmonies = [
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: (h + 150) % 360, s: s, l: l, label: '+150°' },
                    { h: (h + 210) % 360, s: s, l: l, label: '+210°' }
                ];
                break;
            case 'monochromatic':
                description = "A single color extended using its shades, tones, and tints. Gentle and soothing.";
                // For monochromatic, vary lightness and saturation
                harmonies = [
                    { h: h, s: s, l: Math.max(0, l - 30), label: 'Darker' },
                    { h: h, s: Math.max(0, s - 30), l: l, label: 'Desaturated' },
                    { h: h, s: s, l: l, label: 'Base' },
                    { h: h, s: Math.min(100, s + 30), l: l, label: 'Saturated' },
                    { h: h, s: s, l: Math.min(100, l + 30), label: 'Lighter' }
                ];
                break;
        }

        if (descriptionEl) descriptionEl.innerText = description;

        // Render harmonies
        harmonies.forEach(color => {
            const [r, g, b] = hsl2rgb(color.h, color.s / 100, color.l / 100);
            const rInt = Math.round(r * 255);
            const gInt = Math.round(g * 255);
            const bInt = Math.round(b * 255);
            const hex = rgb2hex265(rInt, gInt, bInt);

            const swatchWrapper = document.createElement('div');
            swatchWrapper.className = 'harmony-swatch-wrapper';
            swatchWrapper.onclick = () => this.updateSandboxColorHsl(color.h, color.s, color.l);

            // Calculate text color (black/white) for contrast
            // Use shadow for white text to ensure legibility on light/mixed backgrounds
            const isDark = color.l < 50; // simple threshold for now
            const textColor = color.l > 60 ? '#000' : '#fff'; // stricter threshold for black text
            const textShadow = textColor === '#fff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none';

            swatchWrapper.innerHTML = `
                <div class="harmony-swatch" style="background: hsl(${color.h}, ${color.s}%, ${color.l}%);">
                   <span class="harmony-label" style="color: ${textColor}; text-shadow: ${textShadow};">${color.label}</span>
                </div>
                <div class="harmony-values">
                    <span class="code">${hex}</span>
                    <span class="code" style="font-size: 0.85em; color: #666;">hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)</span>
                </div>
            `;
            container.appendChild(swatchWrapper);
        });

        // Sync Fixed Slider for Harmony Wheel
        const harmonyFixedSlider = $("#harmonyFixedSlider");
        const harmonyFixedLabel = $("#harmonyFixedLabel");
        const harmonyFixedValue = $("#valHarmonyFixed");
        const harmonyFixedUnit = $("#valHarmonyFixedUnit");

        if (harmonyFixedSlider) {
            if (this.harmonyWheelMode === 'saturation') {
                // Wheel controls Hue & Saturation. Slider controls Lightness.
                harmonyFixedLabel.textContent = "Lightness";
                harmonyFixedSlider.max = 100;
                harmonyFixedSlider.value = l;
                harmonyFixedValue.textContent = l;
                harmonyFixedUnit.textContent = "%";
                harmonyFixedSlider.style.background = `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`;
            } else {
                // Wheel controls Hue & Lightness. Slider controls Saturation.
                harmonyFixedLabel.textContent = "Saturation";
                harmonyFixedSlider.max = 100;
                harmonyFixedSlider.value = s;
                harmonyFixedValue.textContent = s;
                harmonyFixedUnit.textContent = "%";
                harmonyFixedSlider.style.background = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
            }
        }

        // Update Wheel
        this.drawColorWheel();
        this.drawHarmonyIndicators(harmonies, h, s, l);
    },

    /**
     * Draws the static color wheel background
     */
    drawColorWheel() {
        if (!this.wheelCtx || !this.wheelCanvas) return;

        const ctx = this.wheelCtx;
        const width = this.wheelCanvas.width;
        const height = this.wheelCanvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        ctx.clearRect(0, 0, width, height);

        // Draw wrapper ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.stroke();

        const curH = parseInt($("#valHue").innerHTML);
        const curS = parseInt($("#valSat").innerHTML);
        const curL = parseInt($("#valLight").innerHTML);

        if (this.harmonyWheelMode === 'saturation') {
            // Mode: Hue (Angle) x Saturation (Radius)
            // Lightness is fixed (controlled by slider)

            // 1. Draw solid background of Grey (HSL(0, 0%, L))
            ctx.fillStyle = `hsl(0, 0%, ${curL}%)`;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.fill();

            // 2. Draw Conic Hue Gradient
            if (ctx.createConicGradient) {
                const scaledHueGradient = ctx.createConicGradient(0, cx, cy);
                for (let i = 0; i <= 360; i += 10) {
                    scaledHueGradient.addColorStop(i / 360, `hsl(${i}, 100%, ${curL}%)`);
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.clip();
                ctx.fillStyle = scaledHueGradient;
                ctx.fill();

                // Now overlay Radial Gradient to desaturate center.
                const satGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                satGradient.addColorStop(0, `hsl(0, 0%, ${curL}%)`);
                satGradient.addColorStop(1, `hsla(0, 0%, ${curL}%, 0)`);

                ctx.fillStyle = satGradient;
                ctx.fill();
                ctx.restore();
            }

        } else {
            // Mode: Hue (Angle) x Lightness (Radius)
            // Saturation is fixed (controlled by slider)

            // 1. Draw Conic Hue Gradient at Fixed Saturation, L=50%
            if (ctx.createConicGradient) {
                const hueGradient = ctx.createConicGradient(0, cx, cy);
                for (let i = 0; i <= 360; i += 10) {
                    hueGradient.addColorStop(i / 360, `hsl(${i}, ${curS}%, 50%)`);
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.clip();
                ctx.fillStyle = hueGradient;
                ctx.fill();

                // 2. Overlay Radial Gradient for Lightness
                const lightGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

                lightGradient.addColorStop(0, "rgba(255, 255, 255, 1)");   // Center: White coverage
                lightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)"); // Mid: Transparent
                lightGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");       // Mid: Start black gradient
                lightGradient.addColorStop(1, "rgba(0, 0, 0, 1)");          // Edge: Black coverage

                ctx.fillStyle = lightGradient;
                ctx.fill();
                ctx.restore();
            }
        }
    },

    /**
     * Draws indicators for the current harmonies on the wheel
     */
    drawHarmonyIndicators(harmonies, curH, curS, curL) {
        if (!this.wheelCtx || !this.wheelCanvas) return;
        const ctx = this.wheelCtx;
        const width = this.wheelCanvas.width;
        const height = this.wheelCanvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        // Draw indicators
        harmonies.forEach((hConf, index) => {
            const angleRad = (hConf.h) * Math.PI / 180;

            // Calculate radius ratio based on mode
            let ratio = 1.0;
            if (this.harmonyWheelMode === 'saturation') {
                // Radius = Saturation
                ratio = hConf.s / 100;
            } else {
                // Radius maps Lightness: 100 -> 0; 0 -> 1
                // Center(0) = 100L. Edge(1) = 0L.
                // r = 1 - (L/100)
                ratio = 1 - (hConf.l / 100);
            }

            // Clamp ratio 0-1
            ratio = Math.max(0, Math.min(1, ratio));

            const dist = radius * ratio;
            const x = cx + Math.cos(angleRad) * dist;
            const y = cy + Math.sin(angleRad) * dist;

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = index === 0 ? "#fff" : `hsl(${hConf.h}, ${hConf.s}%, ${hConf.l}%)`;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            // Connector line to center for base
            if (index === 0) {
                ctx.beginPath();
                ctx.arc(x, y, 9, 0, 2 * Math.PI);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    },

    /**
     * Handle interaction with the wheel to change hue and sat/light
     */
    handleWheelInteraction(e) {
        if (!this.wheelCanvas) return;
        const rect = this.wheelCanvas.getBoundingClientRect();

        // Handle both Touch and Mouse events properly
        const clientX = e.clientX !== undefined ? e.clientX : e.pageX;
        const clientY = e.clientY !== undefined ? e.clientY : e.pageY;

        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        const radius = Math.min(rect.width, rect.height) / 2 - 10; // Match draw radius approx

        // 1. Calculate Angle -> Hue
        let angle = Math.atan2(y, x);
        let degrees = angle * (180 / Math.PI);
        if (degrees < 0) degrees += 360;
        degrees = Math.round(degrees);

        // 2. Calculate Distance -> Saturation or Lightness
        const dist = Math.sqrt(x * x + y * y);
        const maxDist = rect.width / 2 - 10 * (rect.width / 325);

        let ratio = dist / maxDist;

        // Clamp ratio 0-1
        ratio = Math.min(1, Math.max(0, ratio));

        // Get current values
        const curS = parseInt($("#valSat").innerHTML);
        const curL = parseInt($("#valLight").innerHTML);

        let newS = curS;
        let newL = curL;

        if (this.harmonyWheelMode === 'saturation') {
            // Dist 0 -> S=0. Dist 1 -> S=100.
            newS = Math.round(ratio * 100);
            // Lightness is preserved (controlled by slider)
        } else {
            // Dist 0 -> L=100. Dist 1 -> L=0.
            newL = Math.round((1 - ratio) * 100);
            // Saturation is preserved
        }

        this.updateSandboxColorHsl(degrees, newS, newL);
    },

    /**
     * Sets the harmony wheel mode (saturation or lightness)
     */
    setHarmonyWheelMode(mode) {
        this.harmonyWheelMode = mode;
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);
        this.updateHarmonyExplorer(h, s, l);
    },

    /**
     * Handles changes to the harmony fixed slider
     */
    handleHarmonyFixedSliderChange(value) {
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);

        if (this.harmonyWheelMode === 'saturation') {
            // Slider controls Lightness
            this.updateSandboxColorHsl(h, s, value);
        } else {
            // Slider controls Saturation
            this.updateSandboxColorHsl(h, value, l);
        }
    }
};

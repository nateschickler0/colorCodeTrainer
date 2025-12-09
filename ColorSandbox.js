/**
 * ColorSandbox.js - Main Color Sandbox class
 * Orchestrates color manipulation using modular components
 */

class ColorSandbox {
    constructor(r, g, b) {
        if (ColorSandbox._instance) {
            return ColorSandbox._instance;
        }
        ColorSandbox._instance = this;

        // Default state for mixins
        this.pickerMode = 'sat-light'; // 'sat-light', 'hue-sat', 'hue-light'
        this.harmonyMode = 'tetradic';
        this.harmonyWheelMode = 'saturation'; // 'saturation' or 'lightness'

        this.initHarmonyWheel();
        this.updateSandboxColor(r, g, b);
    }

    updateSandboxColorHsl(
        h = $("#valHue").innerHTML, s = $("#valSat").innerHTML, l = $("#valLight").innerHTML
    ) {
        const [r, g, b] = hsl2rgb(h, s / 100, l / 100);
        this.updateSandboxColor(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), h, s, l);
    }

    /**
     * Updates everywhere in HTML where the sandbox color is displayed.
     * @param r
     * @param g
     * @param b
     * @param h (optional) override hue (simplifies precision/rounding issues)
     * @param s (optional) override saturation (simplifies precision/rounding issues)
     * @param l (optional) override lightness (simplifies precision/rounding issues)
     */
    updateSandboxColor(r = $("#valRed").innerHTML, g = $("#valGreen").innerHTML, b = $("#valBlue").innerHTML, h = null, s = null, l = null) {
        this.r = r;
        this.g = g;
        this.b = b;

        $("#valRed").innerHTML = r;
        $("#valGreen").innerHTML = g;
        $("#valBlue").innerHTML = b;

        $("#slideRed").value = r;
        $("#slideGreen").value = g;
        $("#slideBlue").value = b;

        let hDec, sDec, lDec;

        if (h === null || s === null || l === null) {
            [hDec, sDec, lDec] = rgbToHsl(r, g, b);
            h = Math.round(hDec);
            s = Math.round(sDec * 100);
            l = Math.round(lDec * 100);
        }

        $("#valHue").innerHTML = h;
        $("#valSat").innerHTML = s;
        $("#valLight").innerHTML = l;

        $("#slideHue").value = h;
        $("#slideSat").value = s;
        $("#slideLight").value = l;

        // Update 2D picker fixed slider based on mode
        this.updateFixedSlider(h, s, l);

        // Update color swatch and text displays
        $("#swatchOverlay").style.background = `rgb(${r}, ${g}, ${b})`;
        $("#valRgb").innerHTML = `rgb(${r} ${g} ${b})`;
        $("#valHex").innerHTML = rgb2hex265(r, g, b);
        $("#valHsl").innerHTML = `hsl(${h}deg ${s}% ${l}%)`;

        // Calculate inverse color for text (using complementary lightness)
        const inverseL = l > 50 ? 10 : 90;
        const inverseColor = `hsl(${h}, ${s}%, ${inverseL}%)`;
        $("#valRgb").style.color = inverseColor;
        $("#valHex").style.color = inverseColor;
        $("#valHsl").style.color = inverseColor;

        this.updateSliderGradients(r, g, b, h, s, l);

        this.updateColorValueTables(h, s, l);

        this.updateNearbyColors(h, s, l);

        this.updateHarmonyExplorer(h, s, l);
    }

    /**
     * Generates and renders random nearby colors
     */
    updateNearbyColors(h, s, l) {
        // Ensure inputs are numbers to prevent string concatenation logic errors
        h = parseInt(h);
        s = parseInt(s);
        l = parseInt(l);

        const container = $("#nearbyColors");
        container.innerHTML = '';

        // Calculate number of columns to ensure exactly 4 rows
        // Min width is 40px as per CSS
        const containerWidth = container.offsetWidth;
        // If container width is 0 (hidden), default to something reasonable or retry
        if (containerWidth === 0) return;

        // We need to know how many columns CSS grid will create.
        // grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        // This creates as many 40px columns as possible.
        const cols = Math.floor(containerWidth / 40);
        const count = cols * 4; // 4 rows

        for (let i = 0; i < count; i++) {
            // Calculate distance from center column (normalized 0 to 1)
            const colIndex = i % cols;
            const centerCol = (cols - 1) / 2;
            const dist = Math.abs(colIndex - centerCol);
            const maxDist = cols / 1.5;
            const distFactor = maxDist > 0 ? dist / maxDist : 0; // 0 at center, ~1 at edges

            // Generate variations - increase variance further from center
            // Hue: +/- 15 at center, up to +/- 60 at edges
            // Sat/Light: +/- 10 at center, up to +/- 30 at edges
            const hueLimit = 15 + Math.round(distFactor * 45);
            const satLimit = 10 + Math.round(distFactor * 20);
            const lightLimit = 10 + Math.round(distFactor * 20);

            const hueVar = Math.floor(Math.random() * (hueLimit * 2 + 1)) - hueLimit;
            const satVar = Math.floor(Math.random() * (satLimit * 2 + 1)) - satLimit;
            const lightVar = Math.floor(Math.random() * (lightLimit * 2 + 1)) - lightLimit;

            let newH = (h + hueVar + 360) % 360;
            let newS = Math.max(0, Math.min(100, s + satVar));
            let newL = Math.max(0, Math.min(100, l + lightVar));

            const tile = document.createElement('div');
            tile.className = 'color-tile';
            tile.style.background = `hsl(${newH}, ${newS}%, ${newL}%)`;
            tile.title = `hsl(${newH}, ${newS}%, ${newL}%)`;

            tile.onclick = () => {
                this.updateSandboxColorHsl(newH, newS, newL);
            };

            container.appendChild(tile);
        }
    }

    /**
     * Updates the background gradients of all sliders to show the range of possible colors
     */
    updateSliderGradients(r, g, b, h, s, l) {
        // RGB sliders - show gradient based on current other channel values
        $("#slideRed").style.background = `linear-gradient(to right, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
        $("#slideGreen").style.background = `linear-gradient(to right, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
        $("#slideBlue").style.background = `linear-gradient(to right, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;

        // Hue slider - always shows full spectrum at current saturation and lightness
        $("#slideHue").style.background = `linear-gradient(to right, 
            hsl(0, ${s}%, ${l}%), 
            hsl(60, ${s}%, ${l}%), 
            hsl(120, ${s}%, ${l}%), 
            hsl(180, ${s}%, ${l}%), 
            hsl(240, ${s}%, ${l}%), 
            hsl(300, ${s}%, ${l}%), 
            hsl(360, ${s}%, ${l}%)
        )`;

        // Saturation slider - shows grayscale to full saturation at current hue and lightness
        $("#slideSat").style.background = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;

        // Lightness slider - shows black to white through current hue at full saturation
        $("#slideLight").style.background = `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`;

        // Update 2D picker
        this.update2DPicker(h, s, l);
    }
}

// Apply mixins to ColorSandbox prototype
Object.assign(ColorSandbox.prototype, TwoDPickerMixin);
Object.assign(ColorSandbox.prototype, HarmonyExplorerMixin);
Object.assign(ColorSandbox.prototype, ColorTablesMixin);

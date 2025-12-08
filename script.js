const $ = (sel) => document.querySelector(sel);

// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
const hsl2rgb = (h, s, l, a = s * Math.min(l, 1 - l), f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) => [f(0), f(8), f(4)];
// h: 0..360, s/l: 0..1
const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m, l = (M + m) / 2;
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    const h = !d ? 0 : 60 * (M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4);
    return [h, s, l];
};
// r,g,b are in [0-1], result e.g. #0812fa.
const rgb2hex = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, 0)).join('');
const rgb2hex265 = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, 0)).join('');

class ColorSandbox {
    constructor(r, g, b) {
        if (ColorSandbox._instance) {
            return ColorSandbox._instance;
        }
        ColorSandbox._instance = this;
        this.pickerMode = 'sat-light'; // 'sat-light', 'hue-sat', 'hue-light'
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
     * @param h (optional) override hue
     * @param s (optional) override saturation
     * @param l (optional) override lightness
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

        // Update slider gradients
        this.updateSliderGradients(r, g, b, h, s, l);

        // Update color value tables
        this.updateColorValueTables(h, s, l);

        // Update nearby colors
        this.updateNearbyColors(h, s, l);
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

    /**
     * Sets the 2D picker mode and updates UI accordingly
     */
    setPickerMode(mode) {
        this.pickerMode = mode;
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);

        // Update axis labels and fixed slider based on mode
        this.updatePickerLabels();
        this.updateFixedSliderConfig();
        this.updateFixedSlider(h, s, l);
        this.update2DPicker(h, s, l);
    }

    /**
     * Updates axis labels based on current mode
     */
    updatePickerLabels() {
        const leftLabel = $("#axisLabelLeft");
        const bottomLabel = $("#axisLabelBottom");
        const topValue = $("#axisValueTop");
        const bottomRightValue = $("#axisValueBottomRight");
        const leftTopValue = $("#axisValueLeftTop");

        switch (this.pickerMode) {
            case 'sat-light':
                leftLabel.textContent = 'Lightness';
                bottomLabel.textContent = 'Saturation';
                topValue.textContent = '100%';
                bottomRightValue.textContent = '100%';
                leftTopValue.textContent = 'L';
                break;
            case 'hue-sat':
                leftLabel.textContent = 'Saturation';
                bottomLabel.textContent = 'Hue';
                topValue.textContent = '100%';
                bottomRightValue.textContent = '360°';
                leftTopValue.textContent = 'S';
                break;
            case 'hue-light':
                leftLabel.textContent = 'Lightness';
                bottomLabel.textContent = 'Hue';
                topValue.textContent = '100%';
                bottomRightValue.textContent = '360°';
                leftTopValue.textContent = 'L';
                break;
            case 'red-green':
                leftLabel.textContent = 'Green';
                bottomLabel.textContent = 'Red';
                topValue.textContent = '255';
                bottomRightValue.textContent = '255';
                leftTopValue.textContent = 'G';
                break;
            case 'red-blue':
                leftLabel.textContent = 'Blue';
                bottomLabel.textContent = 'Red';
                topValue.textContent = '255';
                bottomRightValue.textContent = '255';
                leftTopValue.textContent = 'B';
                break;
            case 'green-blue':
                leftLabel.textContent = 'Blue';
                bottomLabel.textContent = 'Green';
                topValue.textContent = '255';
                bottomRightValue.textContent = '255';
                leftTopValue.textContent = 'B';
                break;
        }
    }

    /**
     * Configures the fixed slider based on current mode
     */
    updateFixedSliderConfig() {
        const slider = $("#slideFixed2d");
        const label = $("#fixedSliderLabel");
        const unit = $("#valFixed2dUnit");

        switch (this.pickerMode) {
            case 'sat-light':
                label.textContent = 'Hue';
                slider.min = '0';
                slider.max = '360';
                unit.textContent = '°';
                this.updateFixedSliderGradient('hue');
                break;
            case 'hue-sat':
                label.textContent = 'Lightness';
                slider.min = '0';
                slider.max = '100';
                unit.textContent = '%';
                this.updateFixedSliderGradient('lightness');
                break;
            case 'hue-light':
                label.textContent = 'Saturation';
                slider.min = '0';
                slider.max = '100';
                unit.textContent = '%';
                this.updateFixedSliderGradient('saturation');
                break;
            case 'red-green':
                label.textContent = 'Blue';
                slider.min = '0';
                slider.max = '255';
                unit.textContent = '';
                this.updateFixedSliderGradient('blue');
                break;
            case 'red-blue':
                label.textContent = 'Green';
                slider.min = '0';
                slider.max = '255';
                unit.textContent = '';
                this.updateFixedSliderGradient('green');
                break;
            case 'green-blue':
                label.textContent = 'Red';
                slider.min = '0';
                slider.max = '255';
                unit.textContent = '';
                this.updateFixedSliderGradient('red');
                break;
        }
    }

    /**
     * Updates the fixed slider gradient based on type
     */
    updateFixedSliderGradient(type) {
        const slider = $("#slideFixed2d");
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);
        const r = parseInt($("#valRed").innerHTML);
        const g = parseInt($("#valGreen").innerHTML);
        const b = parseInt($("#valBlue").innerHTML);
        const direction = 'to right';

        switch (type) {
            case 'hue':
                slider.style.background = `linear-gradient(${direction},
                    hsl(0, ${s}%, ${l}%),
                    hsl(60, ${s}%, ${l}%),
                    hsl(120, ${s}%, ${l}%),
                    hsl(180, ${s}%, ${l}%),
                    hsl(240, ${s}%, ${l}%),
                    hsl(300, ${s}%, ${l}%),
                    hsl(360, ${s}%, ${l}%))`;
                break;
            case 'saturation':
                slider.style.background = `linear-gradient(${direction}, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
                break;
            case 'lightness':
                slider.style.background = `linear-gradient(${direction}, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`;
                break;
            case 'red':
                slider.style.background = `linear-gradient(${direction}, rgb(0, ${g}, ${b}), rgb(255, ${g}, ${b}))`;
                break;
            case 'green':
                slider.style.background = `linear-gradient(${direction}, rgb(${r}, 0, ${b}), rgb(${r}, 255, ${b}))`;
                break;
            case 'blue':
                slider.style.background = `linear-gradient(${direction}, rgb(${r}, ${g}, 0), rgb(${r}, ${g}, 255))`;
                break;
        }
    }

    /**
     * Updates the fixed slider value display based on current mode
     */
    updateFixedSlider(h, s, l) {
        const slider = $("#slideFixed2d");
        const valueDisplay = $("#valFixed2d");
        const r = parseInt($("#valRed").innerHTML);
        const g = parseInt($("#valGreen").innerHTML);
        const b = parseInt($("#valBlue").innerHTML);

        switch (this.pickerMode) {
            case 'sat-light':
                slider.value = h;
                valueDisplay.textContent = h;
                this.updateFixedSliderGradient('hue');
                break;
            case 'hue-sat':
                slider.value = l;
                valueDisplay.textContent = l;
                this.updateFixedSliderGradient('lightness');
                break;
            case 'hue-light':
                slider.value = s;
                valueDisplay.textContent = s;
                this.updateFixedSliderGradient('saturation');
                break;
            case 'red-green':
                slider.value = b;
                valueDisplay.textContent = b;
                this.updateFixedSliderGradient('blue');
                break;
            case 'red-blue':
                slider.value = g;
                valueDisplay.textContent = g;
                this.updateFixedSliderGradient('green');
                break;
            case 'green-blue':
                slider.value = r;
                valueDisplay.textContent = r;
                this.updateFixedSliderGradient('red');
                break;
        }
    }

    /**
     * Handles changes to the fixed slider
     */
    handleFixedSliderChange(value) {
        const h = parseInt($("#valHue").innerHTML);
        const s = parseInt($("#valSat").innerHTML);
        const l = parseInt($("#valLight").innerHTML);
        const r = parseInt($("#valRed").innerHTML);
        const g = parseInt($("#valGreen").innerHTML);
        const b = parseInt($("#valBlue").innerHTML);

        switch (this.pickerMode) {
            case 'sat-light':
                this.updateSandboxColorHsl(value, s, l);
                break;
            case 'hue-sat':
                this.updateSandboxColorHsl(h, s, value);
                break;
            case 'hue-light':
                this.updateSandboxColorHsl(h, value, l);
                break;
            case 'red-green':
                this.updateSandboxColor(r, g, value);
                break;
            case 'red-blue':
                this.updateSandboxColor(r, value, b);
                break;
            case 'green-blue':
                this.updateSandboxColor(value, g, b);
                break;
        }
    }

    /**
     * Renders the 2D picker canvas and updates crosshair position
     */
    update2DPicker(h, s, l) {
        const canvas = $("#slPicker");
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        const currentR = parseInt($("#valRed").innerHTML);
        const currentG = parseInt($("#valGreen").innerHTML);
        const currentB = parseInt($("#valBlue").innerHTML);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let pixelH, pixelS, pixelL;
                let pixelR, pixelG, pixelB;
                let useRgb = false;

                switch (this.pickerMode) {
                    case 'sat-light':
                        // X = Saturation, Y = Lightness, Fixed = Hue
                        pixelS = x / (width - 1);
                        pixelL = 1 - (y / (height - 1));
                        pixelH = h;
                        break;
                    case 'hue-sat':
                        // X = Hue, Y = Saturation, Fixed = Lightness
                        pixelH = (x / (width - 1)) * 360;
                        pixelS = 1 - (y / (height - 1));
                        pixelL = l / 100;
                        break;
                    case 'hue-light':
                        // X = Hue, Y = Lightness, Fixed = Saturation
                        pixelH = (x / (width - 1)) * 360;
                        pixelL = 1 - (y / (height - 1));
                        pixelS = s / 100;
                        break;
                    case 'red-green':
                        // X = Red, Y = Green, Fixed = Blue
                        pixelR = (x / (width - 1)) * 255;
                        pixelG = (1 - y / (height - 1)) * 255;
                        pixelB = currentB;
                        useRgb = true;
                        break;
                    case 'red-blue':
                        // X = Red, Y = Blue, Fixed = Green
                        pixelR = (x / (width - 1)) * 255;
                        pixelB = (1 - y / (height - 1)) * 255;
                        pixelG = currentG;
                        useRgb = true;
                        break;
                    case 'green-blue':
                        // X = Green, Y = Blue, Fixed = Red
                        pixelG = (x / (width - 1)) * 255;
                        pixelB = (1 - y / (height - 1)) * 255;
                        pixelR = currentR;
                        useRgb = true;
                        break;
                }

                const idx = (y * width + x) * 4;
                if (useRgb) {
                    data[idx] = Math.round(pixelR);
                    data[idx + 1] = Math.round(pixelG);
                    data[idx + 2] = Math.round(pixelB);
                } else {
                    const [r, g, b] = hsl2rgb(pixelH, pixelS, pixelL);
                    data[idx] = Math.round(r * 255);
                    data[idx + 1] = Math.round(g * 255);
                    data[idx + 2] = Math.round(b * 255);
                }
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Update crosshair position based on mode
        const crosshair = $("#pickerCrosshair");
        let xPos, yPos;

        switch (this.pickerMode) {
            case 'sat-light':
                xPos = (s / 100) * width;
                yPos = (1 - l / 100) * height;
                break;
            case 'hue-sat':
                xPos = (h / 360) * width;
                yPos = (1 - s / 100) * height;
                break;
            case 'hue-light':
                xPos = (h / 360) * width;
                yPos = (1 - l / 100) * height;
                break;
            case 'red-green':
                xPos = (parseInt($("#valRed").innerHTML) / 255) * width;
                yPos = (1 - parseInt($("#valGreen").innerHTML) / 255) * height;
                break;
            case 'red-blue':
                xPos = (parseInt($("#valRed").innerHTML) / 255) * width;
                yPos = (1 - parseInt($("#valBlue").innerHTML) / 255) * height;
                break;
            case 'green-blue':
                xPos = (parseInt($("#valGreen").innerHTML) / 255) * width;
                yPos = (1 - parseInt($("#valBlue").innerHTML) / 255) * height;
                break;
        }

        crosshair.style.left = `${xPos}px`;
        crosshair.style.top = `${yPos}px`;
    }

    /**
     * Handle click/drag on the 2D picker
     */
    handlePickerInteraction(e) {
        const canvas = $("#slPicker");
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
        const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

        const currentH = parseInt($("#valHue").innerHTML);
        const currentS = parseInt($("#valSat").innerHTML);
        const currentL = parseInt($("#valLight").innerHTML);
        const currentR = parseInt($("#valRed").innerHTML);
        const currentG = parseInt($("#valGreen").innerHTML);
        const currentB = parseInt($("#valBlue").innerHTML);

        let h, s, l, r, g, b;

        switch (this.pickerMode) {
            case 'sat-light':
                s = Math.round((x / canvas.width) * 100);
                l = Math.round((1 - y / canvas.height) * 100);
                h = currentH;
                this.updateSandboxColorHsl(h, s, l);
                return;
            case 'hue-sat':
                h = Math.round((x / canvas.width) * 360);
                s = Math.round((1 - y / canvas.height) * 100);
                l = currentL;
                this.updateSandboxColorHsl(h, s, l);
                return;
            case 'hue-light':
                h = Math.round((x / canvas.width) * 360);
                l = Math.round((1 - y / canvas.height) * 100);
                s = currentS;
                this.updateSandboxColorHsl(h, s, l);
                return;
            case 'red-green':
                r = Math.round((x / canvas.width) * 255);
                g = Math.round((1 - y / canvas.height) * 255);
                this.updateSandboxColor(r, g, currentB);
                return;
            case 'red-blue':
                r = Math.round((x / canvas.width) * 255);
                b = Math.round((1 - y / canvas.height) * 255);
                this.updateSandboxColor(r, currentG, b);
                return;
            case 'green-blue':
                g = Math.round((x / canvas.width) * 255);
                b = Math.round((1 - y / canvas.height) * 255);
                this.updateSandboxColor(currentR, g, b);
                return;
        }
    }

    /**
     * Updates all three color value tables (Hue, Saturation, Lightness)
     */
    updateColorValueTables(h, s, l) {
        this.updateHueTable(h, s, l);
        this.updateSaturationTable(h, s, l);
        this.updateLightnessTable(h, s, l);
    }

    /**
     * Generates a table row for a given HSL color
     */
    generateTableRow(hue, sat, light, valueLabel, isCurrent) {
        const [r, g, b] = hsl2rgb(hue, sat / 100, light / 100);
        const rInt = Math.round(r * 255);
        const gInt = Math.round(g * 255);
        const bInt = Math.round(b * 255);
        const hex = rgb2hex265(rInt, gInt, bInt);
        const rgbStr = `rgb(${rInt}, ${gInt}, ${bInt})`;
        const hslStr = `hsl(${Math.round(hue)}, ${sat}%, ${light}%)`;
        const bgColor = `hsl(${hue}, ${sat}%, ${light}%)`;
        const currentClass = isCurrent ? 'current-row' : '';

        return `
            <tr class="${currentClass}" onclick="colorSandbox.updateSandboxColorHsl(${Math.round(hue)}, ${sat}, ${light})" style="cursor: pointer;">
                <td class="swatch-cell"><div class="swatch" style="background: ${bgColor};"></div></td>
                <td class="value-cell">${valueLabel}</td>
                <td>${hex}</td>
                <td>${rgbStr}</td>
                <td>${hslStr}</td>
            </tr>
        `;
    }

    /**
     * Updates the Hue table with values from 0 to 360 in 15-degree increments
     */
    updateHueTable(h, s, l) {
        const tbody = $("#hueTableBody");
        const hueValues = [];

        // Generate hue values at 15-degree increments
        for (let hue = 0; hue <= 360; hue += 15) {
            hueValues.push({ value: hue, isCurrent: false });
        }

        // Add current hue if not already at a 15-degree increment
        const nearestHue = Math.round(h / 15) * 15;
        if (h !== nearestHue) {
            hueValues.push({ value: h, isCurrent: true });
        } else {
            // Mark the matching increment as current
            const match = hueValues.find(v => v.value === nearestHue);
            if (match) match.isCurrent = true;
        }

        // Sort by hue value
        hueValues.sort((a, b) => a.value - b.value);

        let html = '';
        for (const item of hueValues) {
            html += this.generateTableRow(item.value, s, l, item.value, item.isCurrent);
        }

        tbody.innerHTML = html;
    }

    /**
     * Updates the Saturation table with values from 0 to 100 in 5% increments
     */
    updateSaturationTable(h, s, l) {
        const tbody = $("#saturationTableBody");
        const satValues = [];

        // Generate saturation values at 5% increments
        for (let sat = 0; sat <= 100; sat += 5) {
            satValues.push({ value: sat, isCurrent: false });
        }

        // Add current saturation if not already at a 5% increment
        const nearestSat = Math.round(s / 5) * 5;
        if (s !== nearestSat) {
            satValues.push({ value: s, isCurrent: true });
        } else {
            // Mark the matching increment as current
            const match = satValues.find(v => v.value === nearestSat);
            if (match) match.isCurrent = true;
        }

        // Sort by saturation value (descending - 100% at top)
        satValues.sort((a, b) => b.value - a.value);

        let html = '';
        for (const item of satValues) {
            html += this.generateTableRow(h, item.value, l, `${item.value}%`, item.isCurrent);
        }

        tbody.innerHTML = html;
    }

    /**
     * Updates the Lightness table with values from 0 to 100 in 5% increments
     */
    updateLightnessTable(h, s, l) {
        const tbody = $("#lightnessTableBody");
        const lightValues = [];

        // Generate lightness values at 5% increments
        for (let light = 0; light <= 100; light += 5) {
            lightValues.push({ value: light, isCurrent: false });
        }

        // Add current lightness if not already at a 5% increment
        const nearestLight = Math.round(l / 5) * 5;
        if (l !== nearestLight) {
            lightValues.push({ value: l, isCurrent: true });
        } else {
            // Mark the matching increment as current
            const match = lightValues.find(v => v.value === nearestLight);
            if (match) match.isCurrent = true;
        }

        // Sort by lightness value (descending - 100% at top)
        lightValues.sort((a, b) => b.value - a.value);

        let html = '';
        for (const item of lightValues) {
            html += this.generateTableRow(h, s, item.value, `${item.value}%`, item.isCurrent);
        }

        tbody.innerHTML = html;
    }
}

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

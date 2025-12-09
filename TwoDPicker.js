/**
 * TwoDPicker.js - 2D Color Space Picker mixin
 * Methods for the 2D color picker functionality
 */

const TwoDPickerMixin = {
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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
};

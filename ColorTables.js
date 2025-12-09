/**
 * ColorTables.js - Color Value Tables mixin
 * Methods for generating and rendering HSL value tables
 */

const ColorTablesMixin = {
    /**
     * Updates all three color value tables (Hue, Saturation, Lightness)
     */
    updateColorValueTables(h, s, l) {
        this.updateHueTable(h, s, l);
        this.updateSaturationTable(h, s, l);
        this.updateLightnessTable(h, s, l);
    },

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
    },

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
    },

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
    },

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
};

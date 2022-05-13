import { useEffect, useState } from "react";

function getCSSProperty(variable, element) {
    if (!element) element = document.body;
    return getComputedStyle(element).getPropertyValue(`--${variable}`);
}

/**
 * Reactively gets a CSS property
 * @param {string} property The name of a CSS property without the leading `--`
 * @param {HTMLElement} element The element whose styles will be used to find the value of `property`
 * @returns {string} The value of `property`
 */
export default function useTheme(property, element) {
    const [value, setValue] = useState(getCSSProperty(property, element));
    useEffect(() => {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            setValue(getCSSProperty(property, element));
        });
    }, [property, element]);
    return value;
}
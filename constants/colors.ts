/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#22281f',
    tint: '#dc6540',

    // Core surfaces
    background: '#fffdf7',
    foreground: '#22281f',

    // Cards / elevated surfaces
    card: '#f7f4eb',
    cardForeground: '#22281f',

    // Primary action color (buttons, links, active states)
    primary: '#d9613f',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e7eadc',
    secondaryForeground: '#283127',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f1eee5',
    mutedForeground: '#77796e',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#fbe9d8',
    accentForeground: '#8f422c',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e8e3d7',
    input: '#e8e3d7',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;

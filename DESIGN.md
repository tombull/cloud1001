# Design System Document

## 1. Overview & Creative North Star

### Creative North Star: "The Astral Terminal"
This design system is a synthesis of 1960s retro-futurism and high-density technical interfaces. It rejects the "friendly" softness of modern SaaS in favor of a rigid, authoritative, and surrealist editorial experience. It is built on the tension between cold, mathematical precision (the "Techno-Minimalist") and the fluid, expansive unknown (the "Psychedelic").

The experience breaks standard template molds by utilizing:
*   **Intentional Asymmetry:** Grid placements that favor heavy left-aligned technical data countered by vast, ethereal right-aligned negative space or imagery.
*   **The Terminal Lens:** Every screen should feel like a high-end command console viewing a dream. 
*   **Data as Art:** Monospaced labels and "Ghost Borders" serve as a structural cage for vivid, neon-infused celestial visuals.

---

## 2. Colors

The palette is anchored in `surface` (deep charcoal/black) to ensure the `on-surface` (white/silver) typography cuts through with clinical clarity.

### The "No-Line" Rule
Traditional 1px solid borders are prohibited for layout sectioning. Visual boundaries must be established through:
1.  **Tonal Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Negative Space:** Using the Spacing Scale to create "voids" that act as dividers.
3.  **The Ghost Border:** For internal component containment only, use `outline-variant` at 15% opacity.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical plates. 
*   **Base:** `surface` (#0e0e0e)
*   **Primary Containers:** `surface-container-low` (#131313)
*   **Floating Elements/Interactive Cards:** `surface-container-high` (#201f1f)
*   **Accents:** Use `tertiary` (#e966ff) and `primary` (#a1faff) only for critical data points or high-energy gradients.

### The "Glass & Gradient" Rule
To evoke the psychedelic sci-fi aesthetic, interactive surfaces should utilize **Glassmorphism**. 
*   **Effect:** Semi-transparent `surface-variant` with a 12px-20px backdrop-blur. 
*   **Soul:** CTAs should never be flat. Use a linear gradient from `primary` (#a1faff) to `primary-container` (#00f4fe) to give buttons a "glowing filament" feel.

---

## 3. Typography

The system utilizes **Space Grotesk** across all scales to maintain a technical, monospaced-adjacent feel while ensuring the legibility of a high-end sans-serif.

*   **Display (lg/md):** Used for "Hero" moments. Letter spacing should be set to `-0.02em` to create a dense, architectural block of text.
*   **Headline & Title:** The "Technical Readout." These should be high-contrast (`on-surface`) and used to anchor grid sections.
*   **Body (lg/md):** Set in `on-surface-variant` (#adaaaa) to reduce eye strain against the black background, reserving pure white for interactive or highlighted text.
*   **Labels (md/sm):** The "Metadata." Always uppercase with `+0.05em` letter spacing to mimic terminal data entries.

---

## 4. Elevation & Depth

### Tonal Layering
Avoid shadows where possible. Hierarchy is achieved by "stacking" the `surface-container` tiers. 
*   **Example:** A `surface-container-highest` card placed on a `surface-container-low` background creates a natural, sophisticated lift without the clutter of drop shadows.

### Ambient Shadows
If a floating effect (like a dropdown or modal) is required:
*   **Shadow:** Use a 40px blur, 0px offset.
*   **Color:** Use `surface-tint` at 8% opacity. This creates a "glow" rather than a shadow, reinforcing the high-tech terminal aesthetic.

### Glassmorphism & Depth
For surrealist elements (clouds, celestial bodies), place them behind a `surface-container-lowest` layer with 50% opacity and a high blur. This makes the UI feel like it is "hovering" over a nebula.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), black text (`on-primary-fixed`), 0px corner radius.
*   **Secondary:** No fill. `outline-variant` ghost border (20% opacity). Silver text.
*   **State:** On hover, the ghost border transitions to 100% `primary` opacity.

### Input Fields
*   **Style:** Underline only (2px `outline-variant`). No containing box. 
*   **Active State:** Underline glows with `primary` (#a1faff). Helper text uses `label-sm` in `tertiary`.

### Cards & Lists
*   **Rule:** No dividers. 
*   **Structure:** Use vertical white space (32px+) or a subtle shift to `surface-container-low`. 
*   **Interactive Cards:** On hover, shift background to `surface-container-highest` and apply a 1px `primary` ghost border.

### New Component: The "Data-Strip"
A thin, horizontal element used at the top of sections containing `label-sm` metadata (e.g., coordinates, timestamps, or version numbers). It uses a 10% opacity `primary` background to anchor the page grid.

---

## 6. Do's and Don'ts

### Do
*   **Do** use 0px border radius for everything. The system is "Hard-Edged."
*   **Do** lean into extreme contrast. If it’s not `on-surface` white, it should be a deep, dark neutral.
*   **Do** use "Psychedelic" imagery as a background texture behind transparent UI layers.

### Don't
*   **Don't** use "Soft" colors or pastels. Stick to neon accents and charcoal bases.
*   **Don't** use standard drop shadows. They break the terminal illusion.
*   **Don't** use centered layouts. This system is designed for an editorial, asymmetric grid.
*   **Don't** use 1px solid, 100% opaque borders. They are too "web-standard" and lack the required sophistication.
# Image Outlines

Images can disappear into nearby surfaces when their outer pixels have similar
colors. Paint a faint edge inside the image so its geometry remains visible.

## Rules

- Prefer a one-pixel inset outline or inset shadow over a border. It must not
  change layout or image dimensions.
- Start near black at 10% in light mode and white at 10% in dark mode. Keep the
  practical range between 5% and 20%.
- Apply the treatment to thumbnails, logos, and avatars, including circular
  media.
- Preserve the image radius and place the edge over the outermost pixels.

```html
<img
  class="rounded-lg outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
/>
```

Source: [Image Outlines](https://craft.gustavofior.com/image-outlines), Gustavo
Fior, published 2026-07-15.

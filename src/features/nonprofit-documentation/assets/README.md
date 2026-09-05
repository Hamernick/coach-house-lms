# Documentation artwork

Generated with the built-in image tool using the user's September 5 screenshots
as style references. The current article set follows the 6:22 PM reference:
heavily defocused, broad color fields with subtle grain and no objects or lettering.
Each of the 41 article pages has its own original image in [heroes](heroes), mapped
by slug in `components/documentation-artwork.ts`. No shared-image fallback exists.
The [prompt set](heroes/prompts.json) records the exact generation instructions
and each asset's distinct composition. WebP encoding preserves the generated
composition and colors; 1440px images total 1,197,568 bytes.

Task-card derivatives add centered flat white destination graphics without shadows
over heavily blurred blue, coral/peach, and lavender/rose backgrounds. Current
prompts are in [soft-task-graphics.md](soft-task-graphics.md); initial prompts
remain in [task-graphics.md](task-graphics.md).

| Asset | Use |
| --- | --- |
| [heroes](heroes) | 41 distinct article, tool, and resource heroes |
| [task-campaign.webp](task-campaign.webp) | Campaign card: white megaphone on frosted blue |
| [task-funding.webp](task-funding.webp) | Funding card: white planning chart and coins on blurred coral/peach |
| [task-resources.webp](task-resources.webp) | Directory card: white people and resource card on blurred lavender/rose |

## Historical hero prompts

These three shared backgrounds were replaced by the per-page set above. Their
files remain recoverable in Git history; these prompts preserve the earlier work.

### blue

Create ONE original full-bleed abstract editorial artwork for a nonprofit documentation site, using the supplied screenshots ONLY as visual references for the soft abstract image backgrounds. Do not recreate the website, grid, card frames, typography, or logos. The desired visual language is tactile and atmospheric: large flowing translucent organic folds, defocused macro photography, gentle light passing through soft material, subtle analog fine grain, luminous areas balanced with depth. Refined, quiet composition, broad flowing fields of color, no small busy details. Entire image is the artwork edge to edge, no border, no text, no lettering, no logos, no icons, no buildings, no people, no literal landscape, no hard 3D geometric objects, no metallic or glass render look. Landscape 3:2 aspect ratio. Composition must remain attractive when center cropped to 3:1 and 16:9. Palette and composition: predominantly sky blue, pale icy cyan and deep cornflower/cobalt blue, with one subtle muted teal undertone. A broad pale translucent fold sweeps diagonally from upper left to lower right over a luminous blue field; a deeper blue area grounds the lower edge. Similar softness and airy photographic depth to the blue abstract backgrounds in the references, with your own original composition.

### rose

Create ONE original full-bleed abstract editorial artwork for a nonprofit documentation site, using the supplied screenshots ONLY as visual references for the soft abstract image backgrounds. Do not recreate the website, grid, card frames, typography, or logos. The desired visual language is tactile and atmospheric: large flowing translucent organic folds, defocused macro photography, gentle light passing through soft material, subtle analog fine grain, luminous areas balanced with depth. Refined, quiet composition, broad flowing fields of color, no small busy details. Entire image is the artwork edge to edge, no border, no text, no lettering, no logos, no icons, no buildings, no people, no literal landscape, no hard 3D geometric objects, no metallic or glass render look. Landscape 3:2 aspect ratio. Composition must remain attractive when center cropped to 3:1 and 16:9. Palette and composition: dusty rose, blush pink, soft peach, pale lavender highlights and a small cool periwinkle shadow. Large delicate flowing curved layers, like a soft fabric or petal surface seen extremely close and slightly out of focus. An open pale central area and gentle darker rose contours toward the edges. Match the refined pink background reference's softness with your own original composition.

### warm

Create ONE original full-bleed abstract editorial artwork for a nonprofit documentation site, using the supplied screenshots ONLY as visual references for the soft abstract image backgrounds. Do not recreate the website, grid, card frames, typography, or logos. The desired visual language is tactile and atmospheric: large flowing translucent organic folds, defocused macro photography, gentle light passing through soft material, subtle analog fine grain, luminous areas balanced with depth. Refined, quiet composition, broad flowing fields of color, no small busy details. Entire image is the artwork edge to edge, no border, no text, no lettering, no logos, no icons, no buildings, no people, no literal landscape, no hard 3D geometric objects, no metallic or glass render look. Landscape 3:2 aspect ratio. Composition must remain attractive when center cropped to 3:1 and 16:9. Palette and composition: luminous warm yellow and buttery cream with pale apricot/peach edges and a tiny hint of cool sky blue. Large soft curling organic forms, reminiscent of a sunlit petal in extreme macro without depicting a recognizable flower, gentle defocus and subtle analog grain. Keep the center luminous and the flowing curves broad and calm. Match the yellow/peach reference's tactile warmth with your own original composition.

## Rose cleanup prompt

Edit this abstract rose/blush/lavender artwork: remove the tiny dark spurious lettering at the extreme bottom right corner and fill it seamlessly with the neighboring pink texture. Preserve the composition, colors, flowing soft folds, fine grain, lighting, framing and every other part of the image exactly. The entire output must contain no text, no lettering, no signature, no watermark or logos. Output one landscape 3:2 artwork.

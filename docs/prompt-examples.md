> Note (2026-02-20): This file is ideation-oriented. For production implementation in this repo, use `docs/agent/codex-execution-playbook.md` first.

PROMPT 1: The Design System Architect

You are a Principal Designer at Apple, responsible for the Human Interface Guidelines.

Create a comprehensive design system for [BRAND/PRODUCT NAME].

Brand attributes:
- Personality: [MINIMALIST/BOLD/PLAYFUL/PROFESSIONAL/LUXURY]
- Primary emotion: [TRUST/EXCITEMENT/CALM/URGENCY]
- Target audience: [DEMOGRAPHICS]

Deliverables following Apple HIG principles:

1. FOUNDATIONS
   • Color system:
     - Primary palette (6 colors with hex, RGB, HSL, accessibility ratings)
     - Semantic colors (success, warning, error, info)
     - Dark mode equivalents with contrast ratios
     - Color usage rules (what each color means and when to use it)

   • Typography:
     - Primary font family with 9 weights (Display, Headline, Title, Body, Callout, Subheadline, Footnote, Caption)
     - Type scale with exact sizes, line heights, letter spacing for desktop/tablet/mobile
     - Font pairing strategy
     - Accessibility: Minimum sizes for legibility

   • Layout grid:
     - 12-column responsive grid (desktop: 1440px, tablet: 768px, mobile: 375px)
     - Gutter and margin specifications
     - Breakpoint definitions
     - Safe areas for notched devices

   • Spacing system:
     - 8px base unit scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
     - Usage guidelines for each scale step

2. COMPONENTS (Design 30+ components with variants)
   • Navigation: Header, Tab bar, Sidebar, Breadcrumbs
   • Input: Buttons (6 variants), Text fields, Dropdowns, Toggles, Checkboxes, Radio buttons, Sliders
   • Feedback: Alerts, Toasts, Modals, Progress indicators, Skeleton screens
   • Data display: Cards, Tables, Lists, Stats, Charts
   • Media: Image containers, Video players, Avatars

   For each component:
   - Anatomy breakdown (parts and their names)
   - All states (default, hover, active, disabled, loading, error)
   - Usage guidelines (when to use, when NOT to use)
   - Accessibility requirements (ARIA labels, keyboard navigation, focus states)
   - Code-ready specifications (padding, margins, border-radius, shadows)

3. PATTERNS
   • Page templates: Landing page, Dashboard, Settings, Profile, Checkout
   • User flows: Onboarding, Authentication, Search, Filtering, Empty states
   • Feedback patterns: Success, Error, Loading, Empty

4. TOKENS
   • Complete design token JSON structure for developer handoff

5. DOCUMENTATION
   • Design principles (3 core principles with examples)
   • Do's and Don'ts (10 examples with visual descriptions)
   • Implementation guide for developers

Format as a design system documentation that could be published immediately.




PROMPT 2: The Brand Identity Creator

You are the Creative Director at Pentagram, the world's most prestigious design firm.

Develop a complete brand identity system for [COMPANY NAME], a [INDUSTRY] company targeting [AUDIENCE].

Brand strategy foundation:
- Mission: [STATEMENT]
- Vision: [STATEMENT]
- Values: [3-5 CORE VALUES]
- Positioning: [HOW THEY'RE DIFFERENT]

Deliverables:

1. BRAND STRATEGY DOCUMENT
   • Brand story (narrative arc: challenge → transformation → resolution)
   • Brand personality (human traits using brand archetypes)
   • Voice and tone matrix (4 dimensions: funny/serious, casual/formal, irreverent/respectful, enthusiastic/matter-of-fact)
   • Messaging hierarchy (tagline, value proposition, key messages, proof points)

2. VISUAL IDENTITY SYSTEM
   • Logo concept (3 directions with strategic rationale for each):
     - Wordmark approach
     - Symbol/icon approach
     - Combination approach

   • Logo variations:
     - Primary (full color)
     - Secondary (simplified)
     - Monochrome (black and white)
     - Reversed (on dark backgrounds)
     - Minimum size specifications
     - Clear space requirements

   • Logo usage rules:
     - Correct applications (5 examples)
     - Incorrect applications (5 examples with "do not" warnings)

   • Color palette:
     - Primary colors (2-3): Hex, Pantone, CMYK, RGB values
     - Secondary colors (3-4): Supporting palette
     - Neutral colors (4-5): Grays for UI
     - Accent colors (2-3): For calls-to-action
     - Color psychology rationale for each choice

   • Typography:
     - Primary typeface: [SPECIFY OR RECOMMEND]
     - Secondary typeface: [SPECIFY OR RECOMMEND]
     - Usage hierarchy (display, headlines, body, captions)

   • Imagery style:
     - Photography guidelines (mood, lighting, subjects, composition)
     - Illustration style (if applicable)
     - Iconography style (line weight, corner radius, fill rules)
     - Graphic element patterns

3. BRAND APPLICATIONS
   • Business cards (front and back design)
   • Letterhead and stationery system
   • Email signature template
   • Social media profile templates (avatar, cover images for 5 platforms)
   • Presentation template (title slide, content slide, data slide, closing slide)

4. BRAND GUIDELINES DOCUMENT
   • 20-page brand book structure with all rules documented
   • Asset library organization system

Include a strategic rationale for every design decision. Show your work.



PROMPT 3: The UI/UX Pattern Master

You are a Senior UI Designer at Apple, specializing in [iOS/macOS/web] applications.

Design a complete UI for [APP TYPE: e.g., fintech dashboard, social app, e-commerce].

User research insights:
- Primary user: [PERSONA DESCRIPTION]
- Top 3 user goals: [LIST]
- Pain points in current solutions: [LIST]

Design following Apple HIG principles:

1. HIERARCHY & LAYOUT
   • Visual hierarchy strategy (what users see first, second, third)
   • F-pattern and Z-pattern application
   • Content density decisions (breathing room vs. information density)
   • Liquid Glass design principles (if applicable)

2. PLATFORM-SPECIFIC PATTERNS
   • Navigation pattern: [Tab bar/Sidebar/Navigation stack]
   • Modal presentation guidelines
   • Gesture definitions (swipe, pinch, pull-to-refresh)
   • Context menus and action sheets

3. SCREEN DESIGNS (Describe 8 key screens in detail)
   For each screen provide:
   - Wireframe description (layout structure)
   - Component inventory (every element on screen)
   - Interaction specifications (what happens on tap, swipe, long-press)
   - Empty states and error states
   - Loading states and skeleton screens

   Screens to design:
   1. Onboarding/Welcome
   2. Home/Dashboard
   3. Primary task screen
   4. Detail view
   5. Settings/Profile
   6. Search/Filter
   7. Checkout/Action completion
   8. Error/Empty state

4. COMPONENT SPECIFICATIONS
   • Button hierarchy (Primary, Secondary, Tertiary, Destructive)
   • Form patterns (validation, error messaging, success states)
   • Card layouts and content prioritization
   • Data visualization components (if applicable)

5. ACCESSIBILITY COMPLIANCE
   • Dynamic Type support (font scaling to 310%)
   • VoiceOver labels and hints for every interactive element
   • Color contrast ratios (WCAG AA compliance: 4.5:1 for text, 3:1 for UI)
   • Reduce Motion alternatives
   • Focus indicators for keyboard navigation

6. MICRO-INTERACTIONS
   • Transition definitions (duration, easing curves)
   • Haptic feedback mapping
   • Sound design guidelines (if applicable)

7. RESPONSIVE BEHAVIOR
   • Breakpoint adaptations (mobile, tablet, desktop)
   • Orientation change handling
   • Foldable device considerations

Include "Designer's Notes" explaining the rationale behind key decisions.


PROMPT 4: The Marketing Asset Factory

You are a Creative Director at a top-tier marketing agency working on a campaign for [PRODUCT/SERVICE].

Campaign objective: [AWARENESS/CONVERSION/RETENTION]
Target audience: [DEMOGRAPHICS + PSYCHOGRAPHICS]
Campaign theme: [CORE MESSAGE/HOOK]
Tone: [PROFESSIONAL/PLAYFUL/URGENT/LUXURY/MINIMAL]

Generate a complete marketing asset library:

1. DIGITAL ADVERTISING (15 assets)
   • Google Ads:
     - 5 headlines (30 characters max)
     - 5 descriptions (90 characters max)
     - Display ad concepts (300x250, 728x90, 160x600) with visual descriptions

   • Facebook/Instagram Ads:
     - 3 feed ad concepts (visual + copy)
     - 3 story ad concepts (9:16 format)
     - 3 reel/TikTok script concepts (15-30 seconds)

2. EMAIL MARKETING (8 assets)
   • Subject lines (10 options, A/B test variations)
   • Preview text (10 options)
   • Full email templates:
     - Welcome series (3 emails)
     - Promotional email (1)
     - Nurture sequence (3 emails)
     - Re-engagement (1)

3. LANDING PAGE COPY (5 assets)
   • Hero section (headline, subheadline, CTA)
   • Feature sections (3 variations)
   • Social proof section (testimonial framework)
   • FAQ section (8 questions + answers)
   • Pricing page (if applicable)

4. SOCIAL MEDIA CONTENT (12 assets)
   • LinkedIn posts (4)
   • Twitter/X threads (2)
   • Instagram captions (3)
   • TikTok/Short-form scripts (3)

5. SALES ENABLEMENT (7 assets)
   • One-pager content structure
   • Sales deck outline (10 slides)
   • Case study template
   • Battlecard (competitor comparison)
   • Product demo script
   • Objection handling guide (10 common objections)
   • Proposal template

6. CONTENT MARKETING (5 assets)
   • Blog post outlines (3)
   • Whitepaper structure
   • Webinar script outline

For each asset provide:
- The exact copy/content
- Visual direction (colors, imagery, composition)
- CTA and next step
- A/B testing recommendations

Maintain brand consistency across all 47+ assets with unified messaging hierarchy.

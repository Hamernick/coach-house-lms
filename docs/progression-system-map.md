# Progression System Map
Last updated: 2026-01-27

Purpose: single source of truth for accelerator progression, roadmap sections, and user inputs. This doc separates what should be displayed (from DB schemas) from what is confirmed displayed (from live UI observations).

## Sources
- CSV export: Supabase module assignments (provided by Caleb)
- Roadmap section definitions: src/lib/roadmap.ts
- Roadmap homework mapping: src/lib/roadmap/homework.ts

## Accelerator curriculum — questions (modules with questions only)
### Strategic Foundations
- 2. Start with your why
  - Questions: Where are you from?; What experiences in your life led to your concern about and commitment to addressing the problem you are working on?; Why do you believe this work matters now?; Why do you feel called to be part of it?; Share the story behind the mission.
- 3. What is the Need?
  - Questions: Who is experiencing the need?; What is the problem?; What are some key data points to help communicate the problem?; What happens if it is not addressed?; Describe the gap you are closing.
- 4. AI The Need
  - Questions: AI-supported need statement

### Mission, Vision & Values
- 1. Mission
  - Questions: Six favorite mission statements; Mission statement
- 2. Vision
  - Questions: In a few sentences, how would you describe your personal vision statement?; Six favorite vision statements; Vision statement
- 3. Values
  - Questions: In a few words, how would you describe your personal core values?; Six favorite values statements; Define your core organizational values; State the mission, vision, and values in clear language.

### Theory of Change & Systems Thinking
- 1. Theory of Change
  - Questions: Statement 1 (IF / THEN / SO); Statement 2 (IF / THEN / SO); Statement 3 (IF / THEN / SO); Explain the logic behind your work.
- 2. Systems Thinking
  - Questions: Program Snapshot; What Problem Is This Program Responding To—and What Contributes to It?; What Else Is Connected to This Program’s Success?; If This Program Works Well, What Changes—and for Whom?; What Assumption Are You Making About How Change Will Happen?

### Piloting Programs
- 3. Designing your Pilot
  - Questions: What problem are we testing a solution for?; What is the intended short-term change?; What will success look like after the pilot?; Who is the target participant?; Highlight the people and roles needed to deliver the work.; Who else needs to be involved?; What exactly happens in the pilot?; Where will it take place?; How often, and for how long?; How many sessions / groups / activities?; What materials or equipment are required?; What items will incur a direct cost? (Don't worry about amounts for now).; What items will incur an indirect cost? (Don't worry about amounts for now).; How long will the pilot run?; What are the start and end dates?; How many people will you serve?; How does this relate to your larger vision?; Outline the programs you run and who they serve.
- 4. Evaluation
  - Questions: Describe your evaluation plan and key signals.

### Budgets
- 1. Budgeting for a Program
  - Questions: Program_Expense_Breakdown; Summarize the budget and financial priorities.
- 3. Multi-year Budgeting
  - Questions: Over the next 2–3 years, what do you want to happen to your organization?; If growth is a goal, what do you expect to grow? (Check all that apply.); Briefly describe what growth would look like in practice.; If your programs expand or change, what would need to be different?; What assumptions are you currently making about how growth would happen?; Are there expenses you expect in Year 2 or Year 3 that are not included in your current budget?; List any anticipated future expenses and when they might occur.; What would need to be true for your organization to support this growth responsibly?; Where do you feel confident—and where do you feel uncertain?; Who should be involved or consulted as you think about the next 2–3 years?; List specific people you would want to invite into this planning process.

### Fundraising
- 1. Mindset
  - Questions: Fundraising mindset
- 2. Segmentation
  - Questions: What insight from this lesson helped you better understand why different donors respond to different messages or approaches?; Which donor segment or donor type feels most natural or energizing for you to engage right now—and what makes that a good fit?; After reviewing segmentation, what is one small change you could make to communicate more intentionally with a specific group of donors or supporters?
- 3. Treasure Mapping
  - Questions: Do you currently use a CRM (Customer Relationship Management system)?; If no, where do your existing contacts live today? (Check all that apply); Using the sources above, list people or organizations you already know, have interacted with, or could reasonably reconnect with.; Map names into the Treasure Circles (Inner, Community, Institutional, Public, Legacy).; Select 5–10 unique names you will intentionally approach in the next 60–90 days. Note the circle and strategy for each.; Document the CRM plan and prospect pipeline.
- 4. Donor Journey
  - Questions: Select 5–10 individuals or organizations you could realistically engage over the next 60–90 days.; Identify their current stage (Identify, Introduce, Cultivate, Steward).; Define one clear next action step for each person.; Capture it simply (Name, Treasure Circle, Stage, Next Action, Target timeframe).; Closing reflection (1–2 sentences); Detail your fundraising strategy and targets.
- 5. Channels
  - Questions: Digital channels (check all you are currently using); Events & in-person channels (check all that apply); Peer & community channels (check all that apply); Are there one or more channels you want to develop over the next year? If yes, which and why?; Explain how you plan to raise the resources you need.
- 6. Storytelling & the Ask
  - Questions: Your personal case for support (draft); Short AI-generated case for support; Long AI-generated case for support; Elevator pitch version (30–60 seconds); Optional reflection (1–2 sentences); Outline the presentation materials and key messages.
- 7. Tools & Systems
  - Questions: Current tools; Tools you want help with
- 8. Corporate Giving
  - Questions: Identify high-fit corporate sectors (list 3–5).; List 5–10 specific companies that feel like strong fits.; Map your network access for each company.; Define the entry strategy for 2–3 priority companies.

### Communications
- 1. Comms as Mission
  - Questions: Inform — Community members; Inform — Partners & ecosystem; Inform — Clients / participants; Inspire — Community members; Inspire — Partners & ecosystem; Inspire — Clients / participants; Invite — Community members; Invite — Partners & ecosystem; Invite — Clients / participants; Closing reflection (1 sentence)
- 3. Comprehensive Plan
  - Questions: Annual rhythm — Q1; Annual rhythm — Q2; Annual rhythm — Q3; Annual rhythm — Q4; 90-day focus — primary audience(s); 90-day focus — key message(s); 90-day focus — primary invitation(s); 90-day focus — core channels; Cadence — social; Cadence — email; Cadence — long-form content; Cadence — other; AI support notes; Optional reflection (1 sentence); Describe how you communicate with stakeholders.

### Boards that make a difference
- 1. Intro to Boards
  - Questions: Summarize board strategy and recruitment goals.
- 4. Policy 4: Board Self Governance
  - Questions: Capture board policies and onboarding materials.
- 5. Annual Calendar
  - Questions: List the board calendar and important milestones.
- 6. Agendas, Minutes, Resolutions
  - Questions: List the next actions and who owns them.

## Confirmed display status (only where observed)
- Start with your why
  - Displayed: Where are you from?
  - Missing: What experiences in your life led to your concern about and commitment to addressing the problem you are working on?; Why do you believe this work matters now?; Why do you feel called to be part of it?; Share the story behind the mission.
- What is the Need?
  - Displayed: Who is experiencing the need?; What is the problem?
  - Missing: What are some key data points to help communicate the problem?; What happens if it is not addressed?; Describe the gap you are closing.
- Multi-year Budgeting
  - Displayed: Over the next 2–3 years, what do you want to happen to your organization?
  - Missing: If growth is a goal, what do you expect to grow? (Check all that apply.); Briefly describe what growth would look like in practice.; If your programs expand or change, what would need to be different?; What assumptions are you currently making about how growth would happen?; Are there expenses you expect in Year 2 or Year 3 that are not included in your current budget?; List any anticipated future expenses and when they might occur.; What would need to be true for your organization to support this growth responsibly?; Where do you feel confident—and where do you feel uncertain?; Who should be involved or consulted as you think about the next 2–3 years?; List specific people you would want to invite into this planning process.

## Display audit checklist (modules with questions only)
Use this to mark modules as you verify them in the UI.
### Strategic Foundations
- [ ] 2. Start with your why (should: 5)
- [ ] 3. What is the Need? (should: 5)
- [ ] 4. AI The Need (should: 1)

### Mission, Vision & Values
- [ ] 1. Mission (should: 2)
- [ ] 2. Vision (should: 3)
- [ ] 3. Values (should: 4)

### Theory of Change & Systems Thinking
- [ ] 1. Theory of Change (should: 4)
- [ ] 2. Systems Thinking (should: 5)

### Piloting Programs
- [ ] 3. Designing your Pilot (should: 18)
- [ ] 4. Evaluation (should: 1)

### Budgets
- [ ] 1. Budgeting for a Program (should: 2)
- [ ] 3. Multi-year Budgeting (should: 11)

### Fundraising
- [ ] 1. Mindset (should: 1)
- [ ] 2. Segmentation (should: 3)
- [ ] 3. Treasure Mapping (should: 6)
- [ ] 4. Donor Journey (should: 6)
- [ ] 5. Channels (should: 5)
- [ ] 6. Storytelling & the Ask (should: 6)
- [ ] 7. Tools & Systems (should: 2)
- [ ] 8. Corporate Giving (should: 4)

### Communications
- [ ] 1. Comms as Mission (should: 10)
- [ ] 3. Comprehensive Plan (should: 15)

### Boards that make a difference
- [ ] 1. Intro to Boards (should: 1)
- [ ] 4. Policy 4: Board Self Governance (should: 1)
- [ ] 5. Annual Calendar (should: 1)
- [ ] 6. Agendas, Minutes, Resolutions (should: 1)

## Rendered but not in DB (confirmed)
- None confirmed yet.

## Strategic Roadmap sections and inputs
Each section captures: Title, Subtitle, Body Content, Visibility (public/private), Layout, Optional CTA, Optional Image.
Note: “Strategic Roadmap” is the overall heading and is not a section.

- Origin Story
  - Slug: origin-story
  - Subtitle: How the organization started and what sparked the work.
  - Prompt: Share the story behind the mission.
  - Placeholder: Describe the moment or pattern that made the need impossible to ignore, and who was affected. Mention the early steps you took and how the organization took shape.
  - Title example: Example: Why we began
  - Subtitle example: Example: The moment that made the need clear
- Need
  - Slug: need
  - Subtitle: The community need or problem you are solving.
  - Prompt: Describe the gap you are closing.
  - Placeholder: Explain the specific problem, who it impacts, and why existing solutions fall short. Use a concrete example or data point to show urgency and scale.
  - Title example: Example: The need we are addressing
  - Subtitle example: Example: Who is impacted and what is missing
- Mission, Vision, Values
  - Slug: mission-vision-values
  - Subtitle: Your guiding statements and principles.
  - Prompt: State the mission, vision, and values in clear language.
  - Placeholder: State the mission in one clear sentence, then describe the vision of the future you are working toward. List 3-5 values and describe how they guide decisions.
  - Title example: Example: Our mission and vision
  - Subtitle example: Example: The values that guide our decisions
- Theory of Change
  - Slug: theory-of-change
  - Subtitle: How your inputs and activities lead to outcomes.
  - Prompt: Explain the logic behind your work.
  - Placeholder: Explain the chain from inputs to activities to outcomes, in plain language. Call out the key assumptions you are testing and the indicators that prove progress.
  - Title example: Example: How change happens
  - Subtitle example: Example: The pathway from inputs to impact
- Program
  - Slug: program
  - Subtitle: Core programs, services, and delivery model.
  - Prompt: Outline the programs you run and who they serve.
  - Placeholder: Outline the core programs or services, the audience served, and how delivery works. Include reach or volume where you can (participants, sites, sessions).
  - Title example: Example: Core programs and services
  - Subtitle example: Example: What we deliver and how
- Evaluation
  - Slug: evaluation
  - Subtitle: How you measure progress and learn.
  - Prompt: Describe your evaluation plan and key signals.
  - Placeholder: Describe how you measure progress and what data you collect. Note how often you review results and how you use findings to improve.
  - Title example: Example: Evaluation approach
  - Subtitle example: Example: What we track and why
- People
  - Slug: people
  - Subtitle: Team, staffing, and volunteers.
  - Prompt: Highlight the people and roles needed to deliver the work.
  - Placeholder: List the key roles needed now and in the next phase, including staff, volunteers, or advisors. Mention gaps or hires that are most critical to success.
  - Title example: Example: Our team and roles
  - Subtitle example: Example: Who does the work
- Budget
  - Slug: budget
  - Subtitle: Current budget and near-term financial plan.
  - Prompt: Summarize the budget and financial priorities.
  - Placeholder: Summarize the current budget and the biggest cost drivers. Note the near-term investments that would unlock growth or impact.
  - Title example: Example: Budget summary
  - Subtitle example: Example: What funding covers
- Fundraising
  - Slug: fundraising
  - Subtitle: Fundraising approach and priorities.
  - Prompt: Explain how you plan to raise the resources you need.
  - Placeholder: Explain the mix of funding sources you rely on and the goals for the next cycle. Include any upcoming campaigns, renewals, or grants you are pursuing.
  - Title example: Example: Fundraising overview
  - Subtitle example: Example: Our fundraising goals
- Strategy
  - Slug: fundraising-strategy
  - Subtitle: Funding strategy and target sources.
  - Prompt: Detail your fundraising strategy and targets.
  - Placeholder: List the top funding targets and how you plan to approach them. Include timelines, expected ask sizes, and what proof points you will share.
  - Title example: Example: Funding strategy
  - Subtitle example: Example: Who we plan to approach
- Presentation
  - Slug: fundraising-presentation
  - Subtitle: Pitch deck and narrative for funders.
  - Prompt: Outline the presentation materials and key messages.
  - Placeholder: Describe the story arc of your pitch and the core messages you want funders to remember. Note which assets are ready (deck, one-pager, demo) and what is missing.
  - Title example: Example: Pitch narrative
  - Subtitle example: Example: How we present the story
- Treasure Map / CRM Plan
  - Slug: treasure-map-crm-plan
  - Subtitle: Prospect list and relationship tracking.
  - Prompt: Document the CRM plan and prospect pipeline.
  - Placeholder: Explain how you track prospects, stages, and follow-ups. Include the size of the pipeline and your cadence for outreach and stewardship.
  - Title example: Example: CRM and prospect plan
  - Subtitle example: Example: Tracking relationships and outreach
- Communications
  - Slug: communications
  - Subtitle: Messaging, channels, and outreach cadence.
  - Prompt: Describe how you communicate with stakeholders.
  - Placeholder: List the primary audiences, channels, and the frequency of outreach. Include the key messages you want consistent across communications.
  - Title example: Example: Communications plan
  - Subtitle example: Example: How we share updates
- Board Strategy
  - Slug: board-strategy
  - Subtitle: Board structure, recruitment, and governance goals.
  - Prompt: Summarize board strategy and recruitment goals.
  - Placeholder: Describe the ideal board composition and the skills or networks you need. Include recruitment targets and governance improvements you want this year.
  - Title example: Example: Board strategy
  - Subtitle example: Example: Governance priorities
- Calendar
  - Slug: board-calendar
  - Subtitle: Board meetings, reporting, and key dates.
  - Prompt: List the board calendar and important milestones.
  - Placeholder: Outline the cadence for meetings, reporting, and committees. Include key dates for budget approvals, strategy reviews, and annual filings.
  - Title example: Example: Board calendar
  - Subtitle example: Example: Key governance milestones
- Handbook
  - Slug: board-handbook
  - Subtitle: Board roles, policies, and onboarding.
  - Prompt: Capture board policies and onboarding materials.
  - Placeholder: List the policies, expectations, and onboarding materials new board members receive. Note anything that needs to be created or updated.
  - Title example: Example: Board handbook
  - Subtitle example: Example: Role expectations and policies
- Next Actions
  - Slug: next-actions
  - Subtitle: Immediate priorities and ownership.
  - Prompt: List the next actions and who owns them.
  - Placeholder: List the top 3-7 actions for the next 30-90 days with owners and due dates. Focus on moves that unlock the next section of work.
  - Title example: Example: Next actions
  - Subtitle example: Example: What we are doing next

## Accelerator → Roadmap homework links
- origin_story
  - strategic-foundations / start-with-your-why — Origin story
- need
  - strategic-foundations / what-is-the-need — Need statement
- mission_vision_values
  - mission-vision-values / values — Mission, vision, values summary
- theory_of_change
  - theory-of-change / theory-of-change — Theory of Change summary
- program
  - piloting-programs / designing-your-pilot — Program summary
- evaluation
  - piloting-programs / evaluation — Evaluation summary
- people
  - piloting-programs / designing-your-pilot — People & roles (pilot team)
- budget
  - session-s5-budgets-program / budgeting-for-a-program — Budget summary
- fundraising
  - session-s7-mindset / channels — Fundraising overview
- fundraising_strategy
  - session-s7-mindset / donor-journey — Fundraising strategy & targets
- fundraising_presentation
  - session-s7-mindset / storytelling-and-the-ask — Fundraising presentation
- fundraising_crm_plan
  - session-s7-mindset / treasure-mapping — CRM plan & pipeline
- communications
  - session-s8-comms-as-mission / comprehensive-plan — Communications plan
- board_strategy
  - session-s9-intro-to-boards / intro-to-boards — Board strategy
- board_calendar
  - session-s9-intro-to-boards / annual-calendar — Board calendar
- board_handbook
  - session-s9-intro-to-boards / policy-4-board-self-governance — Board handbook
- next_actions
  - session-s9-intro-to-boards / agendas-minutes-resolutions — Next actions

## Org profile sync fields
- Strategic Foundations → What is the Need? → Begin developing your need statement → org_key need
- Strategic Foundations → AI The Need → AI-supported need statement → org_key need
- Mission, Vision & Values → Mission → Mission statement → org_key mission
- Mission, Vision & Values → Vision → Vision statement → org_key vision
- Mission, Vision & Values → Values → Define your core organizational values → org_key values
- Piloting Programs → Designing your Pilot → Outline the programs you run and who they serve. → org_key programs

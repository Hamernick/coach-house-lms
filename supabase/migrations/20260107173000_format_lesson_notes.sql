set search_path = public;

do $$
begin
  update modules m
  set content_md = $MD$
## Origin story

Many people freeze when asked to "tell their story," but relax when asked to assemble a few components.

You do not need to get this perfect. You do not need to write a polished story yet.

### Two ways to approach this
- Use a coaching session to develop your origin story. We will interview you, draft it, and revise until it feels true to you and aligned with your work.
- Answer the questions below. Your responses will be the raw material for an initial draft you can refine later.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'strategic-foundations'
    and m.slug = 'start-with-your-why';

  update modules m
  set content_md = $MD$
## Build your need statement

Use AI to combine your answers from the previous module into a fuller need statement.

### Aim for
- A few paragraphs, up to one page.
- Clear language about the problem and the people affected.

### Avoid for now
- Describing your organization.
- Describing your solution.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'strategic-foundations'
    and m.slug = 'ai-the-need';

  update modules m
  set content_md = $MD$
## Theory of Change — homework guidance

Many people freeze when asked to develop a Theory of Change, but relax when asked to assemble a few clear components.

You do not need a polished Theory of Change yet. This is a working draft.

### Recommended approach
- Use a coaching session. We will connect your Need Statement to Mission, Vision, Values, and Theory of Change.

### If you work solo
1. Enter your Need Statement.
2. Enter your Mission, Vision, and Values.
3. Ask an AI tool to generate three "If / Then / So" versions.

### Review questions
- Which version most clearly responds to the need?
- "If": Is this what you intend to do?
- "Then": Is this the change you plan to measure?
- "So": Does this outcome connect back to the problem?

Your goal is clarity. We will refine this later.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'theory-of-change'
    and m.slug = 'theory-of-change';

  update modules m
  set content_md = $MD$
## Systems thinking — program design reflection

Systems thinking helps you slow down and see how change happens, not just what you want to do.

### Use this exercise to
- Move from problem description to program design.
- Notice the conditions that need to shift.

There is no single "right" answer. The goal is thoughtful alignment with the broader system.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'theory-of-change'
    and m.slug = 'systems-thinking';

  update modules m
  set content_md = $MD$
# Module 1 — Intro & goals

Welcome to the course.

## In this module
- Understand the journey.
- Set expectations.
- Meet your cohort.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'foundations'
    and m.slug = 'intro-and-goals';

  update modules m
  set content_md = $MD$
# Module 2 — Core concepts

Review the fundamentals with examples and short exercises.

## What to focus on
- Core definitions and language.
- How the concepts show up in your work.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'foundations'
    and m.slug = 'core-concepts';

  update modules m
  set content_md = $MD$
# Module 3 — Practice & recap

Apply what you've learned and capture key takeaways.

## Your output
- A short reflection.
- The ideas you want to carry forward.
$MD$
  from classes c
  where m.class_id = c.id
    and c.slug = 'foundations'
    and m.slug = 'practice-recap';
end $$;

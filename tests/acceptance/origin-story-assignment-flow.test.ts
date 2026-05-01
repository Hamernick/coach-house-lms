import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { buildAssignmentSections } from "@/components/training/module-detail/assignment-sections"
import { AssignmentFieldsContent } from "@/components/training/module-detail/assignment-form/assignment-fields-content"
import { AssignmentStepNavigation } from "@/components/training/module-detail/assignment-form/assignment-step-navigation"
import { buildModuleStepperSteps } from "@/components/training/module-detail/module-stepper-helpers"
import {
  parseAssignmentCompletionMode,
  parseAssignmentFields,
  shouldTreatAssignmentSubmissionAsComplete,
} from "@/lib/modules"

function originStorySchema() {
  const question = (name: string, label: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
  })

  return {
    title: "Origin Story",
    roadmap_section: "origin_story",
    completion_mode: "all_answered",
    fields: [
      {
        name: "origin_approach_intro",
        label: "How to approach this exercise",
        type: "subtitle",
        screen: "intro",
        description: "Capture your thinking in your own words.",
      },
      {
        name: "origin_start_with_why_intro",
        label: "Start with your why",
        type: "subtitle",
        screen: "intro",
        description: "Every strong organization begins with a personal or community story.",
      },
      {
        name: "origin_roots_intro",
        label: "Section 1 — Roots & background",
        type: "subtitle",
        screen: "intro",
        description: "Ground your story in place, culture, and upbringing.",
      },
      question("origin_roots_place", "Where did you grow up?"),
      question("origin_roots_influences", "What were the major influences in your early life?"),
      question("origin_roots_worldview", "What early experiences shaped how you see the world?"),
      {
        name: "origin_problem_connection_intro",
        label: "Section 2 — Personal connection to the problem",
        type: "subtitle",
        screen: "intro",
      },
      question("origin_problem_issue", "What issue or challenge do you feel called to address?"),
      question("origin_problem_experiences", "What personal experiences connected you to this issue?"),
      question("origin_problem_witnessed", "Have you seen this problem affect people you care about?"),
      {
        name: "origin_turning_points_intro",
        label: "Section 3 — Turning points",
        type: "subtitle",
        screen: "intro",
      },
      question("origin_turning_point", "Was there a specific moment when you wanted to act?"),
      question("origin_turning_people", "Who encouraged or inspired you?"),
      question("origin_turning_obstacles", "What hardships, obstacles, or injustices shaped your motivation?"),
      {
        name: "origin_calling_intro",
        label: "Section 4 — Your sense of calling",
        type: "subtitle",
        screen: "intro",
      },
      question("origin_calling_matter", "Why does this issue matter to you personally?"),
      question("origin_calling_commitment", "What keeps you committed when it is difficult?"),
      question("origin_calling_success", "If your work succeeds, how will people's lives be different?"),
      {
        name: "origin_story_to_work_intro",
        label: "Section 5 — Connecting your story to your work",
        type: "subtitle",
        screen: "intro",
      },
      question("origin_story_leadership", "How does your story uniquely position you to lead this work?"),
      question("origin_story_insights", "What insights do you bring because of your lived experience?"),
      question("origin_story_call", "Describe why you feel called to do this work."),
    ],
  }
}

function needStatementSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (name: string, label: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
  })

  return {
    title: "Need Statement",
    roadmap_section: "need",
    completion_mode: "all_answered",
    fields: [
      intro("need_statement_intro", "Need Statement"),
      intro("need_approach_intro", "How to approach this exercise"),
      intro("need_population_intro", "Section 1 — Who is experiencing the problem"),
      question("need_who", "Who specifically is experiencing this problem?"),
      question("need_location", "Where does this problem occur?"),
      question("need_scale", "How many people do you believe are affected by this problem?"),
      intro("need_problem_intro", "Section 2 — What the problem is"),
      question("need_problem", "What exactly is the problem this group is experiencing?"),
      question("need_contributing_factors", "What factors contribute to this problem?"),
      question("need_daily_life", "How does this problem show up in people's day-to-day lives?"),
      intro("need_impact_intro", "Section 3 — Long-term impact"),
      question("need_consequence", "What happens if this problem continues without change?"),
      intro("need_data_intro", "Section 4 — Understanding the scale using data"),
      question("need_data_points", "What data, metrics, or sources could help demonstrate the scale of this issue?"),
      intro("need_next_steps_intro", "What happens next"),
    ],
  }
}

function whoWeServeSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (name: string, label: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
  })

  return {
    title: "Who We Serve",
    roadmap_section: "who_we_serve",
    completion_mode: "all_answered",
    fields: [
      intro("who_serve_intro", "Who We Serve"),
      intro("who_serve_approach_intro", "How to approach this exercise"),
      intro("who_serve_population_intro", "Section 1 — Defining your core population"),
      question("who_serve_primary_population", "Who is your primary audience or population?"),
      question("who_serve_characteristics", "What are the key characteristics of this group?"),
      question("who_serve_location", "Where are they located?"),
      intro("who_serve_context_intro", "Section 2 — Lived experience and context"),
      question("who_serve_daily_life", "What is this group experiencing in their daily lives?"),
      question("who_serve_patterns", "What are some common experiences or patterns you see within this group?"),
      question("who_serve_strengths", "What strengths or assets does this group already have?"),
      intro("who_serve_barriers_intro", "Section 3 — Barriers and gaps"),
      question("who_serve_barriers", "What barriers does this group face that make it difficult to access opportunities or support?"),
      question("who_serve_system_gaps", "Why are existing systems or services not fully reaching or supporting this group?"),
      intro("who_serve_focus_intro", "Section 4 — Focus and boundaries"),
      question("who_serve_specific_focus", "Within the larger population, is there a more specific group you feel most called to focus on?"),
      question("who_serve_out_of_scope", "Are there groups you are not trying to serve right now?"),
      intro("who_serve_clarity_intro", "Section 5 — Clarity statement"),
      question("who_serve_clarity_statement", "In your own words, describe the people you are trying to serve."),
      intro("who_serve_ai_prompt_intro", "What happens next"),
      intro("who_serve_examples_intro", "Examples to notice"),
    ],
  }
}

function missionStatementSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (name: string, label: string, orgKey?: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
    ...(orgKey ? { org_key: orgKey } : {}),
  })

  return {
    title: "Mission Statement",
    roadmap_section: "mission_vision_values",
    completion_mode: "all_answered",
    fields: [
      intro("mission_intro", "Defining your mission"),
      intro("mission_approach_intro", "How to approach this exercise"),
      intro("mission_what_you_do_intro", "Section 1 — What you do"),
      question("mission_work_in_world", "What are you trying to do in the world?"),
      question("mission_main_activities", "What are the main activities or approaches you plan to use?"),
      intro("mission_who_for_intro", "Section 2 — Who you do it for"),
      question("mission_who_for", "Who are you doing this work for?"),
      question("mission_group_importance", "What makes this group important to focus on?"),
      intro("mission_difference_intro", "Section 3 — The difference you make"),
      question("mission_difference", "What difference does your work make in people's lives?"),
      question("mission_missing_without_work", "If your work did not exist, what would be missing?"),
      question("mission_success_3_years", "If your work is successful, what will be different 3-5 years from now?"),
      intro("mission_approach_distinctiveness_intro", "Section 4 — Your approach and distinctiveness"),
      question("mission_unique_approach", "What is unique about how you approach this work?"),
      question("mission_effective_approach", "Why do you believe your approach will be effective?"),
      intro("mission_pulling_together_intro", "Section 5 — Pulling it together"),
      question("mission_pulling_together", "In your own words, describe what you do, for whom, and the difference it makes."),
      intro("mission_ai_prompt_intro", "What happens next"),
      question("mission_final_statement", "Write or paste your preferred mission statement draft.", "mission"),
      intro("mission_examples_intro", "Examples to notice"),
    ],
  }
}

function visionStatementSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (name: string, label: string, orgKey?: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
    ...(orgKey ? { org_key: orgKey } : {}),
  })

  return {
    title: "Vision Statement",
    roadmap_section: "mission_vision_values",
    completion_mode: "all_answered",
    fields: [
      intro("vision_intro", "Defining your vision"),
      intro("vision_realistic_aspirational_intro", "Realistic or aspirational vision"),
      intro("vision_approach_intro", "How to approach this exercise"),
      intro("vision_people_intro", "Section 1 — The future for the people you serve"),
      question("vision_people_difference", "If your work is successful, what will be different in the lives of the people you serve?"),
      question("vision_individual_success", "What does success look like for individuals?"),
      intro("vision_community_intro", "Section 2 — The future for the community"),
      question("vision_community_difference", "What will be different in the broader community or environment?"),
      question("vision_visible_changes", "What positive changes would others be able to see or feel?"),
      intro("vision_long_term_intro", "Section 3 — Long-term change"),
      question("vision_lasting_change", "Looking 5-10 years ahead, what lasting change do you hope to see?"),
      question("vision_scaled_impact", "If your work scaled or grew, what larger impact could it have?"),
      intro("vision_problem_removed_intro", "Section 4 — Removing the problem"),
      question("vision_need_addressed", "If the problem you described in your need statement were addressed, what would be different?"),
      question("vision_problem_lower_level", "What would no longer exist, or would exist at a much lower level?"),
      intro("vision_type_intro", "Section 5 — Choosing your vision type"),
      {
        name: "vision_type",
        label: "Do you want your vision to be more concrete and measurable, or broad and values-driven?",
        type: "select",
        screen: "question",
        options: [
          "Concrete and measurable",
          "Broad and values-driven",
          "A blend of both",
        ],
      },
      question("vision_type_reason", "Why does this approach fit your work?"),
      intro("vision_pulling_together_intro", "Section 6 — Pulling it together"),
      question("vision_pulling_together", "In your own words, describe the future you are working toward."),
      intro("vision_ai_prompt_intro", "What happens next"),
      question("vision_final_statement", "Write or paste your preferred vision statement draft.", "vision"),
      intro("vision_examples_intro", "Examples to notice"),
    ],
  }
}

function valuesStatementSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (name: string, label: string, orgKey?: string) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
    ...(orgKey ? { org_key: orgKey } : {}),
  })

  return {
    title: "Core Values",
    roadmap_section: "mission_vision_values",
    completion_mode: "all_answered",
    fields: [
      intro("values_intro", "Defining your core values"),
      intro("values_quality_intro", "What makes a value real"),
      intro("values_approach_intro", "How to approach this exercise"),
      intro("values_deep_beliefs_intro", "Section 1 — Your deepest beliefs"),
      question("values_deep_beliefs", "What do you believe deeply about this work and the people you serve?"),
      question("values_hard_principles", "What principles would you hold onto, even if they made your work harder?"),
      intro("values_stand_for_intro", "Section 2 — What you stand for and against"),
      question("values_stand_for", "What do you stand for in how this work should be done?"),
      question("values_do_differently", "What have you seen done poorly that you are committed to doing differently?"),
      question("values_refuse_accept", "What would you push back on or refuse to accept in your field?"),
      intro("values_behavior_intro", "Section 3 — Behavior and standards"),
      question("values_best_operating", "What does it look like when your organization is operating at its best?"),
      question("values_treatment", "How should people be treated in your work?"),
      question("values_non_negotiable_behaviors", "What behaviors are non-negotiable?"),
      intro("values_pressure_intro", "Section 4 — Decision-making under pressure"),
      question("values_decision_principles", "When faced with a difficult decision, what principles will guide your choices?"),
      question("values_never_do", "What would you never do, even if it would lead to more funding, growth, or visibility?"),
      intro("values_pulling_together_intro", "Section 5 — Pulling it together"),
      question("values_pulling_together", "In your own words, describe the principles that should guide your organization."),
      intro("values_ai_prompt_intro", "What happens next"),
      question("values_final_set", "Write or paste your preferred core values set.", "values"),
      intro("values_examples_intro", "Examples to notice"),
    ],
  }
}

function theoryOfChangeSchema() {
  const intro = (name: string, label: string, description = "Guidance") => ({
    name,
    label,
    type: "subtitle",
    screen: "intro",
    description,
  })
  const question = (
    name: string,
    label: string,
    orgKey?: string,
    roadmapSection?: string,
  ) => ({
    name,
    label,
    type: "long_text",
    screen: "question",
    ...(orgKey ? { org_key: orgKey } : {}),
    ...(roadmapSection ? { roadmap_section: roadmapSection } : {}),
  })

  return {
    title: "Theory of Change",
    roadmap_section: "theory_of_change",
    completion_mode: "all_answered",
    fields: [
      intro("toc_intro", "Developing your Theory of Change"),
      intro("toc_framework_intro", "If, Then, So That"),
      intro("toc_approach_intro", "How to approach this exercise"),
      intro("toc_problem_context_intro", "Section 1 — The problem and context"),
      question("toc_core_problem", "What is the core problem you are trying to address?"),
      question("toc_affected_population", "Who is most affected by this problem?"),
      question("toc_conditions_patterns", "What conditions or patterns keep this problem in place?"),
      intro("toc_if_intro", "Section 2 — IF: what you will do, with whom"),
      question("toc_core_activities", "What are the core things you will do to address this problem?"),
      question("toc_participants", "Who will participate in or experience this work?"),
      question("toc_participant_experience", "What will participants actually experience?"),
      intro("toc_then_intro", "Section 3 — THEN: near-term change"),
      question("toc_near_term_change", "As a result of your work, what changes in the near term?"),
      question("toc_shortly_after_engaging", "What is different for participants shortly after engaging?"),
      question("toc_short_term_measures", "What would you expect to observe or measure in the short term?"),
      intro("toc_so_that_intro", "Section 4 — SO THAT: longer-term implications"),
      question("toc_longer_term_leads_to", "If those near-term changes happen, what do they lead to over time?"),
      question("toc_broader_outcomes", "What broader outcomes do you expect for individuals, families, or communities?"),
      question("toc_ultimate_impact", "What is the ultimate impact this contributes to?"),
      intro("toc_assumptions_intro", "Section 5 — Your assumptions"),
      question("toc_sequence_reason", "Why do you believe this sequence will work?"),
      question("toc_change_assumptions", "What assumptions are you making about how change happens?"),
      intro("toc_pulling_together_intro", "Section 6 — Pulling it together"),
      question(
        "toc_pulling_together",
        "In your own words, describe your full Theory of Change using the If, Then, So That structure.",
      ),
      intro("toc_ai_prompt_intro", "What happens next"),
      question(
        "toc_summary",
        "Write or paste your preferred Theory of Change.",
        "theory_of_change",
        "theory_of_change",
      ),
      intro("toc_refine_prompt_intro", "Refining your Theory of Change"),
      intro("toc_examples_intro", "What to notice"),
    ],
  }
}

describe("origin story assignment flow", () => {
  it("ships the expanded Origin Story schema through a Supabase migration", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501161000_expand_origin_story_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(15)
    expect(migration).toContain("'origin_roots_place'")
    expect(migration).toContain("'origin_story_call'")
    expect(migration).toContain("update assignment_submissions")
  })

  it("turns intro metadata and questions into one screen per step", () => {
    const fields = parseAssignmentFields(originStorySchema())
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(originStorySchema())).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(15)
    expect(tabSections).toHaveLength(16)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(7)
    expect(tabSections[1]).toMatchObject({
      title: "Where did you grow up?",
      fields: [expect.objectContaining({ name: "origin_roots_place" })],
    })
    const overviewMarkup = renderToStaticMarkup(
      createElement(AssignmentFieldsContent, {
        isStepper: true,
        shouldUseTabs: true,
        useInlineTabs: false,
        baseSections: tabSections,
        tabSections,
        activeSection: "assignment-overview",
        activeSectionKey: "assignment-overview",
        hasDeck: false,
        moduleId: "origin-module",
        onActiveSectionChange: () => undefined,
        resources: [
          {
            label: "Origin Story guide",
            url: "https://example.com/origin-story",
            provider: "generic",
          },
        ],
        inlineActiveIndex: 0,
        fieldContext: {
          values: {},
          pending: false,
          autoSaving: false,
          isStepper: true,
          roadmapStatusBySectionId: undefined,
          isAcceleratorShell: false,
          richTextMinHeight: 420,
          updateValue: () => undefined,
        },
      }),
    )

    expect(overviewMarkup).toContain("Lesson guide")
    expect(overviewMarkup).toContain("space-y-6")
    expect(overviewMarkup).toContain("sm:space-y-8")
    expect(overviewMarkup).toContain("text-xl")
    expect(overviewMarkup).toContain("sm:text-2xl")
    expect(overviewMarkup).toContain("min-h-11")
    expect(overviewMarkup).not.toContain(["Work", "sheet guide"].join(""))

    const steps = buildModuleStepperSteps({
      embedUrl: null,
      videoUrl: null,
      fallbackUrl: null,
      lessonNotesContent: null,
      resources: [],
      hasDeck: false,
      assignmentFields: fields,
      tabSections,
    })

    expect(steps.filter((step) => step.type === "assignment")).toHaveLength(16)
    expect(steps[0]).toMatchObject({
      label: "Overview",
      type: "assignment",
    })
    expect(steps.at(-1)).toMatchObject({ type: "complete" })
  })

  it("does not complete all-answered assignments until every question has content", () => {
    const schema = originStorySchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: { origin_roots_place: "<p>Chicago</p>" },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("keeps step navigation anchored outside the scrollable question body", () => {
    const fields = parseAssignmentFields(originStorySchema())
    const { tabSections } = buildAssignmentSections(fields)
    const html = renderToStaticMarkup(
      createElement(AssignmentStepNavigation, {
        canGoPrevious: true,
        canGoNext: true,
        currentSection: tabSections[0] ?? null,
        nextSection: tabSections[1] ?? null,
        onPrevious: () => undefined,
        onNext: () => undefined,
      }),
    )

    expect(html).toContain("sticky")
    expect(html).toContain("bottom-0")
    expect(html).toContain("shrink-0")
    expect(html).toContain("py-2")
    expect(html).toContain("rounded-full")
    expect(html).toContain("w-full")
    expect(html).toContain("sm:w-auto")
    expect(html).toContain("Start questions")
  })

  it("ships the Need Statement exercise as a DB-backed multi-question assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501192000_expand_need_statement_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'title', 'Need Statement'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(8)
    expect(migration).toContain("'need_daily_life'")
    expect(migration).toContain("'need_data_points'")
    expect(migration).toContain("what-is-the-need")
  })

  it("turns Need Statement document sections into an overview plus one question per step", () => {
    const schema = needStatementSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(8)
    expect(tabSections).toHaveLength(9)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(7)
    expect(tabSections[1]).toMatchObject({
      title: "Who specifically is experiencing this problem?",
      fields: [expect.objectContaining({ name: "need_who" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "What data, metrics, or sources could help demonstrate the scale of this issue?",
      fields: [expect.objectContaining({ name: "need_data_points" })],
    })
  })

  it("keeps Need Statement incomplete until every document question has an answer", () => {
    const schema = needStatementSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          need_who: "<p>Young people in Roseland</p>",
          need_problem: "<p>Limited access to support</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("adds Who We Serve as its own Strategic Foundations lesson assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501193000_add_who_we_serve_assignment.sql",
      "utf8",
    )

    expect(migration).toContain("'who-we-serve'")
    expect(migration).toContain("'title', 'Who We Serve'")
    expect(migration).toContain("'roadmap_section', 'who_we_serve'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(11)
    expect(migration).toContain("'who_serve_clarity_statement'")
  })

  it("turns Who We Serve into an overview plus one step per document question", () => {
    const schema = whoWeServeSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(11)
    expect(tabSections).toHaveLength(12)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(9)
    expect(tabSections[1]).toMatchObject({
      title: "Who is your primary audience or population?",
      fields: [expect.objectContaining({ name: "who_serve_primary_population" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "In your own words, describe the people you are trying to serve.",
      fields: [expect.objectContaining({ name: "who_serve_clarity_statement" })],
    })
  })

  it("requires every Who We Serve question before treating the lesson as complete", () => {
    const schema = whoWeServeSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          who_serve_primary_population: "<p>Youth ages 14-18</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("ships Mission as a DB-backed multi-question assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501194000_expand_mission_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'title', 'Mission Statement'")
    expect(migration).toContain("'roadmap_section', 'mission_vision_values'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(11)
    expect(migration).toContain("'mission_final_statement'")
    expect(migration).toContain("'org_key', 'mission'")
    expect(migration).toContain("answers ? 'mission'")
  })

  it("turns Mission into an overview plus one step per document question", () => {
    const schema = missionStatementSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(11)
    expect(fields.find((field) => field.name === "mission_final_statement")).toMatchObject({
      orgKey: "mission",
    })
    expect(tabSections).toHaveLength(12)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(9)
    expect(tabSections[1]).toMatchObject({
      title: "What are you trying to do in the world?",
      fields: [expect.objectContaining({ name: "mission_work_in_world" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "Write or paste your preferred mission statement draft.",
      fields: [expect.objectContaining({ name: "mission_final_statement" })],
    })
  })

  it("requires every Mission question before treating the lesson as complete", () => {
    const schema = missionStatementSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          mission_work_in_world: "<p>Increase access to mentorship</p>",
          mission_final_statement: "<p>We provide mentorship.</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("ships Vision as a DB-backed multi-question assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501195000_expand_vision_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'title', 'Vision Statement'")
    expect(migration).toContain("'roadmap_section', 'mission_vision_values'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(12)
    expect(migration).toContain("'vision_final_statement'")
    expect(migration).toContain("'org_key', 'vision'")
    expect(migration).toContain("answers ? 'vision'")
    expect(migration).toContain("answers ? 'vision_personal'")
  })

  it("turns Vision into an overview plus one step per document question", () => {
    const schema = visionStatementSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(12)
    expect(fields.find((field) => field.name === "vision_type")).toMatchObject({
      type: "select",
      options: [
        "Concrete and measurable",
        "Broad and values-driven",
        "A blend of both",
      ],
    })
    expect(fields.find((field) => field.name === "vision_final_statement")).toMatchObject({
      orgKey: "vision",
    })
    expect(tabSections).toHaveLength(13)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(11)
    expect(tabSections[1]).toMatchObject({
      title: "If your work is successful, what will be different in the lives of the people you serve?",
      fields: [expect.objectContaining({ name: "vision_people_difference" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "Write or paste your preferred vision statement draft.",
      fields: [expect.objectContaining({ name: "vision_final_statement" })],
    })
  })

  it("requires every Vision question before treating the lesson as complete", () => {
    const schema = visionStatementSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [
          field.name,
          field.type === "select" ? "A blend of both" : `<p>${field.label}</p>`,
        ]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          vision_people_difference: "<p>People have better options.</p>",
          vision_final_statement: "<p>A thriving future for all.</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("ships Values as a DB-backed multi-question assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501200000_expand_values_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'title', 'Core Values'")
    expect(migration).toContain("'roadmap_section', 'mission_vision_values'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(12)
    expect(migration).toContain("'values_final_set'")
    expect(migration).toContain("'org_key', 'values'")
    expect(migration).toContain("answers ? 'values'")
    expect(migration).toContain("answers ? 'values_personal'")
  })

  it("turns Values into an overview plus one step per document question", () => {
    const schema = valuesStatementSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(12)
    expect(fields.find((field) => field.name === "values_final_set")).toMatchObject({
      orgKey: "values",
    })
    expect(tabSections).toHaveLength(13)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(10)
    expect(tabSections[1]).toMatchObject({
      title: "What do you believe deeply about this work and the people you serve?",
      fields: [expect.objectContaining({ name: "values_deep_beliefs" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "Write or paste your preferred core values set.",
      fields: [expect.objectContaining({ name: "values_final_set" })],
    })
  })

  it("requires every Values question before treating the lesson as complete", () => {
    const schema = valuesStatementSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          values_deep_beliefs: "<p>People should be treated with dignity.</p>",
          values_final_set: "<p>Dignity, honesty, accountability.</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })

  it("ships Theory of Change as a DB-backed multi-question assignment", () => {
    const migration = readFileSync(
      "supabase/migrations/20260501201000_expand_theory_of_change_questions.sql",
      "utf8",
    )

    expect(migration).toContain("'title', 'Theory of Change'")
    expect(migration).toContain("'roadmap_section', 'theory_of_change'")
    expect(migration).toContain("'completion_mode', 'all_answered'")
    expect(migration.match(/'screen', 'question'/g)).toHaveLength(16)
    expect(migration).toContain("'toc_summary'")
    expect(migration).toContain("'org_key', 'theory_of_change'")
    expect(migration).toContain("answers ? 'statement_one'")
  })

  it("turns Theory of Change into an overview plus one step per document question", () => {
    const schema = theoryOfChangeSchema()
    const fields = parseAssignmentFields(schema)
    const { tabSections } = buildAssignmentSections(fields)

    expect(parseAssignmentCompletionMode(schema)).toBe("all_answered")
    expect(fields.filter((field) => field.screen === "question")).toHaveLength(16)
    expect(fields.find((field) => field.name === "toc_summary")).toMatchObject({
      orgKey: "theory_of_change",
      roadmapSectionId: "theory_of_change",
    })
    expect(tabSections).toHaveLength(17)
    expect(tabSections[0]).toMatchObject({
      id: "assignment-overview",
      title: "Overview",
      fields: [],
    })
    expect(tabSections[0]?.infoBlocks).toHaveLength(12)
    expect(tabSections[1]).toMatchObject({
      title: "What is the core problem you are trying to address?",
      fields: [expect.objectContaining({ name: "toc_core_problem" })],
    })
    expect(tabSections.at(-1)).toMatchObject({
      title: "Write or paste your preferred Theory of Change.",
      fields: [expect.objectContaining({ name: "toc_summary" })],
    })
  })

  it("requires every Theory of Change question before treating the lesson as complete", () => {
    const schema = theoryOfChangeSchema()
    const fields = parseAssignmentFields(schema)
    const completionMode = parseAssignmentCompletionMode(schema)
    const allAnswers = Object.fromEntries(
      fields
        .filter((field) => field.screen === "question")
        .map((field) => [field.name, `<p>${field.label}</p>`]),
    )

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: {
          toc_core_problem: "<p>Young adults need stronger pathways.</p>",
          toc_summary: "<p>If we mentor young adults, then pathways improve.</p>",
        },
        status: "submitted",
      }),
    ).toBe(false)

    expect(
      shouldTreatAssignmentSubmissionAsComplete({
        completeOnSubmit: true,
        completionMode,
        fields,
        answers: allAnswers,
        status: "submitted",
      }),
    ).toBe(true)
  })
})

import type { BestPracticeArticle } from "../types"

export const MEASURING_IMPACT_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/measuring-impact",
  navigationTitle: "Measuring impact",
  title: "Measure nonprofit outcomes so the evidence can improve a decision",
  description:
    "A practical U.S. nonprofit guide to outcomes, indicators, evaluation questions, data collection, learning, and a free interactive measurement-plan builder.",
  eyebrow: "Best practices · Measuring impact",
  answer:
    "Nonprofit impact measurement is a disciplined process for learning whether work was delivered as intended, what changed, for whom, under what conditions, and how the evidence should shape a decision. Start with an intended user and use, define one outcome and an answerable question, gather proportionate quantitative and qualitative evidence, state limitations, and act on what you learn.",
  readingTime: "18 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What nonprofit impact measurement can establish",
    stages: "Measure differently as the organization develops",
    example: "Fictional example",
    framework: "A decision-to-use measurement practice",
    checklist: "Measurement-plan quality checklist",
    mistakes: "Common measurement failures",
    measures: "Evidence that the measurement practice is useful",
  },
  definition:
    "Measurement records defined information consistently. Monitoring tracks implementation and change over time. Evaluation uses systematic questions and methods to understand a program, its implementation, outcomes, context, and value for a stated purpose. Outputs are direct products of activities; outcomes are changes in people, organizations, practices, relationships, or conditions. Impact often refers to broader or longer-term change. A program may plausibly contribute to that change without evidence that it caused the change by itself.",
  whyItMatters: [
    "A decision-led plan prevents teams from collecting information simply because it is easy to count, familiar to a funder, or available in a software dashboard.",
    "Clear definitions make results interpretable across staff, participants, partners, reporting periods, sites, and changes in delivery.",
    "Combining implementation evidence with outcome evidence helps a team distinguish a weak idea from inconsistent delivery, insufficient reach, changing context, or an inappropriate measure.",
    "Participant interpretation, disaggregation, access review, data minimization, and explicit limitations reduce the risk of turning incomplete information into a universal claim.",
  ],
  importantNote:
    "A change observed after a program is not automatically caused by the program. Causal attribution requires an appropriate design, credible comparison, adequate data, careful analysis, and qualified review. Most organizations should make bounded contribution claims unless their evidence supports more.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question:
        "Are we defining a change that matters before choosing metrics?",
      guidance:
        "Begin with context, lived experience, existing evidence, and the people affected. Learn how they define the issue and a meaningful improvement before building a survey or promising an impact target.",
      actions: [
        "Write the need separately from the proposed service and identify whose perspective, data, or history is represented or missing.",
        "Draft a small set of possible outcomes with people affected, then test whether each outcome is specific, relevant, observable, and ethically measurable.",
        "Inventory existing administrative, partner, qualitative, and public information before asking people to provide more data.",
      ],
      checkpoint:
        "You can name the intended change, the people affected, the decision the evidence should support, and the perspectives still missing.",
    },
    {
      id: "forming",
      label: "Forming",
      question:
        "Can a pilot answer one useful question with feasible evidence?",
      guidance:
        "Connect the theory of change and logic model to one priority evaluation question. Define the indicator, source, collection rhythm, starting point, responsibility, burden, and use before collecting data.",
      actions: [
        "Choose a process or near-term outcome question appropriate to the program’s age rather than reaching first for long-term impact.",
        "Write an indicator definition that identifies who or what is counted, the numerator and denominator when relevant, the timeframe, and exclusions.",
        "Pilot the collection method for comprehension, accessibility, voluntariness, feasibility, missingness, and staff workflow before treating it as routine.",
      ],
      checkpoint:
        "The team can explain exactly what will be learned, from whom or what, how often, at what burden, with what limits, and who will make which decision.",
    },
    {
      id: "operating",
      label: "Operating",
      question:
        "What does the evidence say about delivery, outcomes, and access?",
      guidance:
        "Review implementation and outcome evidence together. Look for variation, missing data, unintended effects, and changes in context. Interpret patterns with participants and staff before deciding what to continue or change.",
      actions: [
        "Compare intended reach, actual reach, service quality, dosage or participation, outputs, outcomes, costs, and participant experience without collapsing them into one number.",
        "Disaggregate only where the categories are relevant, safe, consented to, and large enough to interpret responsibly; report missingness and suppression rules.",
        "Record the finding, its strength and limitations, alternative explanations, interpretation, decision, owner, and next review date.",
      ],
      checkpoint:
        "A reviewer can trace each claim to a definition and source, understand limitations, and see what the organization changed or chose not to change.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can evidence remain comparable without erasing local context?",
      guidance:
        "Growth requires shared core definitions, data governance, method documentation, and room to examine differences across sites, groups, delivery models, and external conditions.",
      actions: [
        "Maintain a data dictionary, version history, access rules, retention schedule, quality checks, analysis decisions, and claim-review process.",
        "Assess reach, implementation, outcomes, costs, and unintended effects by site or group before assuming the same model works everywhere.",
        "Use qualified independent evaluation when the decision, claim, funding requirement, risk, or causal question exceeds internal capacity.",
      ],
      checkpoint:
        "Shared measures retain stable definitions, local differences remain visible, and expansion decisions state what the evidence does and does not support.",
    },
  ],
  example: {
    name: "Illustrative example: Willow Street Family Resource Network",
    context:
      "A fictional nonprofit is piloting bilingual legal-navigation appointments. Staff want to learn whether the pilot helps residents understand and complete appropriate next steps; they do not control legal-service capacity, agency decisions, court timelines, housing conditions, or case outcomes.",
    weakLabel: "Activity presented as impact",
    weak: "We served 180 residents and therefore improved housing stability in the neighborhood.",
    strongLabel: "Bounded outcome and evidence plan",
    strong:
      "For pilot participants who consent to follow-up, examine whether understanding of options and completion of an appropriate next step changes within 30 days. Combine appointment records, a brief voluntary follow-up, and participant interviews; report response rate, missingness, access barriers, referral capacity, and alternative explanations.",
    reason:
      "The stronger plan separates service volume from participant change, defines who and when, uses complementary evidence, preserves choice, and limits the claim to what the design may support.",
  },
  framework: [
    {
      title: "Name the decision and users",
      instruction:
        "State why the evaluation is being conducted, who needs the findings, when they need them, and the decision they can actually make.",
      prompt:
        "Who will use the evidence to improve, continue, pause, fund, report, or expand what—and by when?",
    },
    {
      title: "Define the outcome",
      instruction:
        "Name who or what may change, the direction and type of change, an appropriate timeframe, and the relationship to the program pathway.",
      prompt:
        "What change is expected, for whom or what, after which experience, and over what period?",
    },
    {
      title: "Focus the evaluation question",
      instruction:
        "Ask one open, answerable question aligned with the program stage, intended use, available resources, timing, and relevant equity considerations.",
      prompt:
        "What do decision-makers need to understand about implementation, reach, outcomes, variation, or unintended effects?",
    },
    {
      title: "Specify the indicator",
      instruction:
        "Define the observable signal, unit, population, calculation, timeframe, exclusions, and interpretation before reviewing results.",
      prompt:
        "What exactly will be observed or calculated, and what would it not tell us?",
    },
    {
      title: "Choose proportionate evidence",
      instruction:
        "Match sources and qualitative or quantitative methods to the question, credibility needs, feasibility, participant burden, access, and privacy.",
      prompt:
        "What existing or new evidence can answer this question with the least reasonable burden and harm?",
    },
    {
      title: "Analyze and interpret",
      instruction:
        "Assess quality and missingness, compare evidence with expectations, examine variation, consider alternative explanations, and interpret findings with people who know the context.",
      prompt:
        "What patterns appear, how certain are they, who might be missing, and what other conditions could explain them?",
    },
    {
      title: "Act and document",
      instruction:
        "Connect findings to a preplanned decision rule, communicate them in usable forms, record the decision and dissent, and define the next learning cycle.",
      prompt:
        "What will we continue, adapt, investigate, pause, or stop—and what evidence would change that decision?",
    },
  ],
  checklist: [
    "The plan names the evaluation purpose, intended users, intended use, owner, timing, and decision authority.",
    "The program pathway distinguishes inputs, activities, outputs, near-term outcomes, intermediate outcomes, and longer-term contribution.",
    "The outcome states who or what may change, the type or direction of change, and an appropriate timeframe.",
    "The evaluation question is open, answerable, bounded, useful, feasible, and aligned with the program’s stage and context.",
    "Every indicator has an operational definition, source, population, timeframe, calculation or coding method, exclusions, and interpretation limits.",
    "Methods fit the question and credibility needs; qualitative evidence is not treated as anecdotal and quantitative evidence is not treated as automatically objective.",
    "The plan inventories existing data, minimizes new collection, estimates burden, and defines access, consent, privacy, retention, and deletion practices.",
    "Collection and interpretation account for language, disability, technology, compensation, power, cultural context, missingness, and safe participation.",
    "Disaggregation categories are relevant and safe, with minimum reporting thresholds or suppression where groups could be identified or misrepresented.",
    "The analysis plan identifies expectations, comparison points, missing-data handling, alternative explanations, limitations, and appropriate claim language.",
    "Participants and relevant partners can interpret, question, or correct findings before consequential conclusions are published or acted on.",
    "The plan states how findings will be communicated, used, documented, revisited, and protected from overclaiming or selective reporting.",
  ],
  mistakes: [
    {
      mistake: "Starting with available metrics instead of a decision.",
      correction:
        "Name the intended user, use, and evaluation question first. Keep only measures that can credibly inform that decision.",
    },
    {
      mistake: "Calling outputs impact.",
      correction:
        "Report services, sessions, referrals, or materials as outputs. Examine a defined change before making an outcome claim.",
    },
    {
      mistake: "Using a change-over-time result as proof of causation.",
      correction:
        "Describe the design, context, comparison, limitations, and alternative explanations. Use contribution language unless attribution is supported.",
    },
    {
      mistake: "Creating a long survey for every participant.",
      correction:
        "Inventory existing information, ask only what the decision needs, pilot the method, estimate burden, and provide accessible voluntary alternatives.",
    },
    {
      mistake: "Treating a single average as the whole story.",
      correction:
        "Review distributions, missingness, experiences, context, and safe relevant variation without exposing or stereotyping small groups.",
    },
    {
      mistake: "Collecting sensitive information without a lifecycle plan.",
      correction:
        "Define necessity, authority, access, security, retention, deletion, consent, risk, and response before collection.",
    },
    {
      mistake: "Publishing only favorable findings.",
      correction:
        "Predefine questions and expectations, report null and unintended findings, preserve limitations, and document interpretation and decisions.",
    },
  ],
  measuresIntroduction:
    "Judge the measurement practice by the usefulness, integrity, and responsible use of evidence—not by the number of metrics, dashboards, survey responses, or positive findings.",
  measures: [
    "Decision use: findings are tied to a documented continue, adapt, investigate, pause, stop, budget, or communication decision.",
    "Definition integrity: indicators retain clear definitions, sources, timeframes, calculations, exclusions, ownership, and version history.",
    "Evidence fitness: methods answer the stated question at a level of rigor proportionate to the consequence of the decision and claim.",
    "Participation quality: affected people can shape questions, use accessible voluntary methods, interpret findings, and see how their input affected decisions.",
    "Burden and privacy: requested information is necessary, collection effort is monitored, access is limited, retention is bounded, and avoidable sensitive data is not gathered.",
    "Transparency: reports include response rates, missingness, variation, uncertainty, limitations, alternative explanations, and appropriate attribution language.",
    "Learning rhythm: owners review evidence on schedule, record adaptations and dissent, and update the program model and next question.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal sequence behind this guide: need, theory of change, systems thinking, program piloting, evaluation, and explicit assumptions.",
    },
    {
      title: "CDC Program Evaluation Framework",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/evaluation/php/evaluation-framework/index.html",
      note: "Current six-step federal framework with collaborative engagement, fair and just practice, use of insights, and five evaluation standards.",
    },
    {
      title: "Step 3 — Focus the Evaluation Questions and Design",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-3-focus-the-evaluation-questions-and-design.html",
      note: "Guidance for connecting purpose, intended users and uses, questions, program stage, feasibility, context, and evaluation design.",
    },
    {
      title: "Step 4 — Gather Credible Evidence",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-4-gather-credible-evidence.html",
      note: "Guidance for selecting methods, indicators, measures, sources, quantity, quality, timing, and context appropriate to the question.",
    },
    {
      title: "Step 5 — Generate and Support Conclusions",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-5-generate-and-support-conclusions.html",
      note: "Guidance for analysis, interpretation, recommendations, and conclusions supported by evidence and context.",
    },
    {
      title: "Step 6 — Act on Findings",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/evaluation/php/evaluation-framework-action-guide/step-6-act-on-findings.html",
      note: "Guidance for planning use, preparing findings, and facilitating insights into action with intended users.",
    },
    {
      title: "Evidence Readiness Resources",
      publisher: "AmeriCorps",
      url: "https://www.americorps.gov/grantees-sponsors/evaluation-resources",
      note: "Federal training and templates for logic models, research questions, evaluation planning, data collection, reporting, and use.",
    },
    {
      title: "Protecting Personal Information: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business",
      note: "Federal guidance to know what personal information is held, keep only what is needed, protect it, dispose of it securely, and plan for incidents.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not determine program effectiveness, causal attribution, evaluation quality, grant compliance, research status, participant consent, privacy compliance, or impact. Requirements and appropriate methods vary by question, population, program, funder, jurisdiction, risk, and intended claim. Review consequential plans and findings with affected people and qualified evaluation, research, privacy, legal, accessibility, data-security, and subject-matter professionals as appropriate.",
  previous: {
    title: "Frameworks",
    href: "/documentation/best-practices/frameworks",
  },
  next: {
    title: "Sustainability",
    href: "/documentation/best-practices/sustainability",
  },
}

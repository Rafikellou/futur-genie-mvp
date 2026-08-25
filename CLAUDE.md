# Project Instructions

## 1. Project Mission

We are building a simple mobile-first application for French elementary-school teachers.

The application allows a teacher to photograph a lesson, send the image to a multimodal LLM, automatically generate age-appropriate exercises based on that lesson, review the generated exercise, publish it, and share a public link with students.

Students open the link in a browser and complete the exercise without installing the application and without creating an account.

The core product promise is:

> A teacher should be able to create and share a useful exercise from a lesson photograph in less than 60 seconds.

Every product, UX, architectural and engineering decision should support this goal.

---

# 2. Product Philosophy

This is an MVP.

The goal is not to build a complete Learning Management System.

The goal is to validate one workflow:

**Lesson photo → AI-generated exercise → teacher review → public link → student exercise**

Prefer simplicity over completeness.

Prefer working end-to-end flows over large numbers of partially implemented features.

Prefer boring, proven technology over sophisticated architecture.

Prefer fewer dependencies, fewer screens, fewer database tables and fewer abstractions when they accomplish the same result.

Do not anticipate hypothetical future requirements unless they affect a decision that would be expensive to reverse.

---

# 3. Primary Users

## Teacher

The main authenticated user is a French elementary-school teacher.

Assume that the teacher:

* is comfortable using normal mobile applications;
* is not technical;
* may use the application quickly between lessons;
* expects the application to require very little configuration;
* expects generated content to be immediately understandable;
* must remain in control of what is ultimately given to students.

The AI generates a draft.

The teacher reviews and publishes it.

## Student

Students are anonymous users in the MVP.

They receive a public link.

They:

1. open the link;
2. see the exercise;
3. answer the questions;
4. submit their answers;
5. see appropriate results or corrections.

Students do not need:

* an account;
* an email address;
* a password;
* an application installation.

Avoid collecting student personal data.

---

# 4. Core User Flow

Protect this workflow throughout development.

## Teacher flow

```text
Sign in
  ↓
Home
  ↓
Create exercise
  ↓
Select grade
  ↓
Select subject
  ↓
Select exercise type
  ↓
Select number of questions
  ↓
Take a photo OR select from photo library
  ↓
Review photo
  ↓
Generate exercise
  ↓
AI analyses lesson
  ↓
AI creates structured quiz
  ↓
Teacher reviews quiz
  ↓
Teacher optionally edits quiz
  ↓
Publish
  ↓
Public link generated
  ↓
Share link
```

## Student flow

```text
Receive link
  ↓
Open link in browser
  ↓
View exercise
  ↓
Answer questions
  ↓
Submit
  ↓
View result / corrections
```

Any change that breaks or complicates this flow must be justified.

---

# 5. MVP Scope

The MVP includes:

* Teacher authentication
* Teacher profile
* Teacher home screen
* Quiz history
* Create exercise workflow
* Grade selection
* Subject selection
* Exercise type selection
* Number of questions selection
* Camera access
* Photo library access
* Image preview
* Image resizing/compression
* Secure image transmission
* Multimodal LLM analysis
* Structured quiz generation
* Quiz preview
* Quiz editing
* Quiz publishing
* Public quiz URLs
* Native mobile sharing
* Copy link
* Anonymous student quiz access
* Anonymous quiz completion
* Basic automatic correction where appropriate
* Basic result screen
* Error handling
* Loading states
* Basic analytics/technical observability required to operate the product

---

# 6. Explicit MVP Exclusions

Do NOT implement any of the following unless the user explicitly changes the product scope:

* Student accounts
* Parent accounts
* Classroom accounts
* School administrator accounts
* Classroom rosters
* School management
* Native ÉcoleDirecte integration
* Native WhatsApp API integration
* Internal email system
* Messaging
* Push notifications
* OCR pipeline
* Payment
* Subscription billing
* Gamification
* Badges
* Leaderboards
* Social features
* Teacher-to-teacher collaboration
* AI chatbot
* LMS integrations
* Google Classroom integration
* Pronote integration
* Complex analytics dashboards
* Homework calendars
* Scheduling
* Attendance
* Student long-term progress tracking
* Complex grading workflows
* PDF generation unless explicitly requested
* Complex content libraries
* Permanent storage of lesson photographs
* Microservices
* Event-driven distributed architecture

If a requested implementation would implicitly introduce one of these features, explain the consequence before building it.

---

# 7. Technology Stack

Use this stack by default.

## Application

* TypeScript
* React Native
* Expo
* Expo Router

The Expo project should support:

* iOS
* Android
* Web

Use one shared codebase whenever practical.

## Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Row Level Security
* Supabase Edge Functions
* Supabase Storage only when required

## AI

* A multimodal LLM capable of understanding lesson photographs
* Server-side API calls only
* Structured outputs
* Zod validation

Do not tightly couple the application to one LLM provider when a small abstraction can avoid it.

However, do NOT create an elaborate provider framework for the MVP.

A simple interface such as:

```ts
generateQuizFromLesson(...)
```

is sufficient.

## Validation

Use Zod for runtime validation of:

* API inputs
* AI outputs
* important application-domain objects

## Package management

Use the package manager already established by the repository.

Do not switch package managers without explicit instruction.

---

# 8. Universal App Architecture

The project should use Expo as a universal application.

Teacher-facing screens are primarily designed for native iOS and Android.

Student public quiz routes must work cleanly on the web.

The public route should conceptually look like:

```text
/q/[slug]
```

Example:

```text
https://app.example.com/q/K7fP3xQa
```

Students opening this URL must not be forced to:

* install the application;
* log in;
* create an account.

The public web experience should be lightweight and mobile friendly.

---

# 9. High-Level Architecture

Keep the architecture conceptually simple.

```text
Teacher
   │
   ▼
Expo Application
   │
   │ authenticated request
   ▼
Supabase
   │
   ▼
Edge Function
   │
   │ lesson image + quiz parameters
   ▼
Multimodal LLM
   │
   │ structured output
   ▼
Zod validation
   │
   ▼
Quiz draft
   │
   ▼
Teacher reviews / edits
   │
   ▼
Supabase
   │
   ▼
Published Quiz
   │
   ▼
Public URL
   │
   ▼
Student browser
```

Avoid adding architectural layers unless they solve a real existing problem.

---

# 10. Specialized Skills

The project contains specialized Claude Code skills under:

```text
.claude/skills/
```

Available skills:

* `product-architect`
* `expo-mobile-engineer`
* `supabase-backend-engineer`
* `pedagogical-ai-engineer`
* `qa-release-engineer`

Use relevant skills when their expertise applies.

Do not duplicate their full procedures inside this file.

## product-architect

Use for:

* feature planning;
* scope decisions;
* architecture decisions;
* milestone planning;
* questions about whether something belongs in the MVP;
* changes touching several layers of the application.

## expo-mobile-engineer

Use for:

* Expo;
* React Native;
* Expo Router;
* UI;
* forms;
* navigation;
* camera;
* image picker;
* mobile permissions;
* sharing;
* public web UI when related to the application frontend.

## supabase-backend-engineer

Use for:

* database changes;
* migrations;
* Supabase Auth;
* RLS;
* Edge Functions;
* storage;
* server-side APIs;
* authorization;
* secrets;
* public quiz access.

## pedagogical-ai-engineer

Use for:

* multimodal lesson interpretation;
* prompts;
* AI generation;
* structured output;
* quiz schemas;
* hallucination mitigation;
* educational quality;
* age appropriateness;
* AI evaluation.

## qa-release-engineer

Use for:

* tests;
* regression checks;
* security review;
* release readiness;
* end-to-end validation;
* bug reproduction;
* validation of completed features.

---

# 11. Skill Orchestration

Do not mechanically invoke every skill for every request.

Use only relevant skills.

For cross-cutting product features, follow this general order when useful:

```text
product-architect
        ↓
domain specialist
        ↓
backend
        ↓
frontend
        ↓
qa-release-engineer
```

For example, when implementing AI quiz generation:

```text
product-architect
        ↓
pedagogical-ai-engineer
        ↓
supabase-backend-engineer
        ↓
expo-mobile-engineer
        ↓
qa-release-engineer
```

For a simple UI correction:

```text
expo-mobile-engineer
        ↓
qa-release-engineer if regression risk exists
```

For a Supabase authorization bug:

```text
supabase-backend-engineer
        ↓
qa-release-engineer
```

Do not turn skill orchestration into bureaucracy.

Skills exist to improve decisions, not to create unnecessary process.

---

# 12. How to Approach User Requests

The project owner is technical enough to understand architecture and implementation concepts but is not a professional software developer.

Communicate accordingly.

Explain:

* important architectural choices;
* meaningful tradeoffs;
* security implications;
* significant costs;
* decisions that will be difficult to reverse.

Do not overwhelm the user with:

* trivial implementation details;
* every file changed;
* internal framework jargon when unnecessary;
* verbose explanations of obvious code.

When a reasonable engineering default exists, choose it instead of asking unnecessary questions.

Ask for clarification only when the answer would materially change the product or architecture.

When uncertainty is minor, make a reasonable assumption and state it.

---

# 13. Feature Development Workflow

For non-trivial features, first understand the existing codebase.

Before editing:

1. Inspect relevant files.
2. Understand existing patterns.
3. Identify affected layers.
4. Check whether a relevant skill should be used.
5. Determine whether the change affects the database or public API.
6. Determine whether the change affects security or privacy.

Then implement the smallest coherent solution.

Do not redesign unrelated parts of the application.

---

# 14. Vertical Slice Principle

Prefer completing one end-to-end feature over building isolated layers.

Bad development order:

```text
Build entire database
Build entire backend
Build entire UI
Integrate everything at the end
```

Preferred development order:

```text
Small feature
→ database if needed
→ backend if needed
→ frontend
→ tests
→ working result
```

Every milestone should leave the application in a runnable state.

---

# 15. Development Milestones

Unless the state of the repository makes another order more appropriate, use this roadmap.

## Milestone 1 — Foundation

Create:

* Expo project
* TypeScript configuration
* Expo Router
* basic application layout
* environment configuration
* Supabase client
* project folder conventions

Result:

The application runs locally on supported platforms.

## Milestone 2 — Authentication

Implement:

* teacher sign-up
* teacher sign-in
* teacher sign-out
* basic profile
* protected teacher routes

Result:

A teacher can securely access the application.

## Milestone 3 — Create Exercise UI

Implement the creation form without AI.

Include:

* grade
* subject
* exercise type
* number of questions

Result:

Teacher can configure an exercise.

## Milestone 4 — Lesson Photo

Implement:

* camera
* photo library
* permissions
* image preview
* image replacement
* reasonable compression/resizing

Result:

Teacher can provide a lesson photograph.

## Milestone 5 — AI Generation

Implement:

* secure server-side generation endpoint
* lesson image transmission
* multimodal AI request
* structured output schema
* Zod validation
* failure handling

Result:

A valid lesson photograph can generate a quiz draft.

## Milestone 6 — Review and Editing

Implement:

* quiz preview
* edit title
* edit instructions
* edit questions
* edit answers
* edit choices
* delete questions

Result:

Teacher controls the final content.

## Milestone 7 — Publishing

Implement:

* draft persistence
* publish action
* secure random public slug
* published state
* public route

Result:

Teacher receives a usable public URL.

## Milestone 8 — Student Experience

Implement:

* public quiz rendering
* answer input
* submission
* automatic correction where applicable
* result display

Result:

Student can complete the exercise without authentication.

## Milestone 9 — Sharing and History

Implement:

* native share sheet
* copy-link action
* teacher quiz history
* open previous quiz

Result:

Teacher can reuse and share generated exercises easily.

## Milestone 10 — Hardening and Release

Perform:

* golden-path testing
* error scenario testing
* privacy review
* RLS review
* secret review
* iOS testing
* Android testing
* web testing
* production environment configuration

---

# 16. Domain Model

Keep the initial domain model small.

## Profile

Represents the authenticated teacher.

Conceptually:

```ts
type Profile = {
  id: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
};
```

Do not duplicate authentication data unnecessarily.

## Quiz

A quiz conceptually contains:

```ts
type Quiz = {
  id: string;
  teacherId: string;
  title: string;
  grade: Grade;
  subject: Subject;
  quizType: QuizType;
  status: "draft" | "published" | "archived";
  quizData: QuizData;
  publicSlug?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};
```

During the MVP, storing question content as JSONB is preferred over creating many normalized relational tables unless a concrete limitation appears.

---

# 17. Supported Grades

Initial grades:

```text
CP
CE1
CE2
CM1
CM2
```

Grade values must be centralized.

Do not duplicate grade strings throughout the codebase.

Prefer a shared domain definition.

---

# 18. Supported Subjects

Initial subjects:

```text
Français
Mathématiques
Histoire
Géographie
Sciences
Anglais
Autre
```

Keep subject definitions centralized.

The architecture should make adding a new subject easy without requiring database redesign.

---

# 19. Supported Exercise Types

Initial exercise types:

```text
Multiple choice
True / False
Short answer
Mixed
```

Question structures should be strongly typed.

Do not represent fundamentally different question types using ambiguous optional properties everywhere if a discriminated union provides a clearer model.

Example conceptual pattern:

```ts
type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion;
```

---

# 20. AI Generation Principles

The lesson photograph is the primary source of truth.

The LLM should generate questions from information visible in the provided lesson.

It should not silently enrich the quiz using unrelated general knowledge.

If the source is insufficient, the system should prefer:

* fewer questions;
* a warning;
* asking the teacher for a clearer photograph;

over invented content.

The AI system must be allowed to fail safely.

---

# 21. AI Input

The generation request should conceptually include:

```text
Lesson image
Grade
Subject
Exercise type
Number of questions
Optional teacher instruction
```

Do not send unnecessary personal data to the model.

---

# 22. AI Output

Never build application logic around parsing uncontrolled prose from the LLM.

Require structured output.

Validate it before returning it to the client.

The canonical quiz response should conceptually contain:

```json
{
  "title": "Les états de l'eau",
  "grade": "CE2",
  "subject": "Sciences",
  "instructions": "Réponds aux questions suivantes.",
  "questions": [],
  "warnings": []
}
```

Each question should contain enough information for:

* rendering;
* editing;
* correction;
* pedagogical verification.

Question-generation details belong primarily in the `pedagogical-ai-engineer` skill.

---

# 23. Source Grounding

Whenever feasible, AI-generated questions should retain internal evidence linking them to the source lesson.

Conceptual example:

```json
{
  "question": "À quelle température l'eau gèle-t-elle ?",
  "correctAnswer": "0 °C",
  "sourceEvidence": "L'eau devient solide à 0 °C."
}
```

`sourceEvidence` is internal quality metadata.

It does not need to be shown to students.

Avoid exposing internal AI metadata through public quiz endpoints.

---

# 24. AI Failure Handling

Treat the following as normal product states, not exceptional crashes:

* unreadable photograph;
* severe blur;
* glare;
* page cropped too aggressively;
* unsupported content;
* model timeout;
* model unavailable;
* invalid structured response;
* insufficient lesson information.

Return stable application-level error codes.

User-facing copy should explain what the teacher can do next.

Never show raw infrastructure errors to end users.

---

# 25. Prompt Management

Do not bury large production prompts directly inside UI components.

Keep production prompts in a clearly identifiable server-side location.

Separate:

* system pedagogical rules;
* task instructions;
* teacher parameters;
* source image;
* output schema.

Prompt changes should be treated as product changes.

Do not casually rewrite production prompts while fixing unrelated features.

---

# 26. AI Evaluation

Maintain a small representative evaluation set as the product develops.

It should eventually cover examples such as:

* CP reading
* CE1 grammar
* CE2 mathematics
* CM1 history
* CM2 science
* dense textbook page
* diagram + text
* table
* partially cropped page
* blurry photograph
* page with examples and definitions

When substantially changing prompts, schemas or LLM providers, evaluate educational output before treating the change as complete.

Do not rely only on whether the API returns HTTP 200.

---

# 27. Authentication

Only teachers authenticate in the MVP.

Use Supabase Auth.

Do not build custom authentication.

Authentication logic must not be duplicated independently across screens.

Protect teacher-only routes.

Expired sessions should fail gracefully.

---

# 28. Database Security

Enable Row Level Security on private Supabase tables.

A teacher must be able to access their own private content and must not be able to access another teacher's private content.

Do not rely solely on application UI to enforce permissions.

Authorization must exist at the database/backend level.

Never disable RLS simply to make development easier.

If RLS blocks expected behavior, fix the policy or architecture.

---

# 29. Public Quiz Security

Published quizzes are intentionally publicly readable using their public slug.

Draft quizzes are not public.

Anonymous users must never gain access to:

* teacher email;
* teacher private profile;
* private quiz drafts;
* source lesson photograph;
* private IDs when unnecessary;
* internal prompt;
* source evidence when unnecessary;
* AI debug information;
* secrets.

Public identifiers must be difficult to guess.

Do not use sequential public URLs.

Bad:

```text
/q/1
/q/2
/q/3
```

Good:

```text
/q/K7fP3xQa
```

---

# 30. Secret Management

Never put privileged credentials in client code.

The following must remain server-side:

* LLM API keys
* Supabase service-role key
* privileged API credentials
* private service credentials

Do not commit secrets to Git.

Do not print secrets in logs.

Do not include secrets in screenshots, fixtures or test data.

Use environment variables and platform secret management.

Remember that variables embedded into a mobile/web client bundle are not secret.

---

# 31. Image Handling

Lesson photographs may contain copyrighted educational material and potentially unintended personal information.

Minimize storage.

Preferred lifecycle:

```text
Teacher takes photo
       ↓
Image prepared for upload
       ↓
Secure processing
       ↓
LLM inference
       ↓
Quiz generated
       ↓
Temporary image removed
```

Do not make lesson photographs publicly accessible.

Do not store them permanently by default.

If permanent image storage becomes necessary later, reconsider privacy, security, retention and product requirements explicitly.

---

# 32. Student Data

The MVP should avoid collecting identifiable student data.

Do not ask students for:

* full name;
* email;
* phone number;
* date of birth;
* school account;

unless future product requirements explicitly require it.

Anonymous responses are preferred initially.

Do not introduce persistent student tracking implicitly.

---

# 33. Privacy by Design

Because the product is used in education and may be used by children, minimize data collection from the beginning.

When designing a feature, ask:

1. Do we really need this data?
2. How long must it exist?
3. Who can access it?
4. Does it need to be sent to the LLM?
5. Can the feature work without identifying a student?

Do not claim legal or GDPR compliance merely because technical safeguards exist.

Flag changes with meaningful privacy implications for review.

---

# 34. UI Principles

The application should feel simpler than the technology behind it.

Never expose implementation vocabulary such as:

* LLM
* inference
* API
* JSON
* token
* Edge Function
* HTTP error
* OCR

to teachers or students.

Use human language.

Bad:

```text
Inference failed with status 422.
```

Good:

```text
Nous n'arrivons pas à lire correctement cette page.
Essayez de reprendre la photo en cadrant toute la leçon.
```

---

# 35. Teacher UX Principles

Optimize for speed.

Prefer:

* large clear controls;
* useful defaults;
* minimal typing;
* obvious primary actions;
* progressive disclosure;
* short forms.

Avoid:

* configuration-heavy screens;
* unnecessary confirmations;
* technical settings;
* deeply nested navigation;
* excessive modal dialogs.

The teacher should not have to understand how the AI works.

---

# 36. Student UX Principles

Student-facing screens should be significantly simpler than teacher-facing screens.

Prioritize:

* readability;
* large touch targets;
* clear progression;
* age-appropriate language;
* minimal distraction.

Do not expose teacher editing features in the public experience.

Do not display the correct answer before the student submits the relevant answer.

---

# 37. Accessibility

Build reasonable accessibility from the start.

Use:

* accessible labels;
* semantic controls;
* adequate contrast;
* readable text sizes;
* sufficiently large touch targets;
* clear focus behavior on web;
* screen-reader-friendly components when practical.

Avoid relying exclusively on color to communicate correctness.

---

# 38. Loading UX

AI generation can take time.

Always represent progress clearly.

Possible French states:

```text
Lecture de la leçon…
Création des questions…
Préparation du devoir…
```

Do not fabricate exact percentages unless real progress information exists.

Prevent duplicate submissions while generation is active.

---

# 39. Error UX

Every meaningful remote operation should account for failure.

Important scenarios include:

* no network;
* upload failed;
* AI timeout;
* unreadable image;
* invalid AI result;
* authentication expired;
* database unavailable;
* publication failed;
* public quiz not found.

Errors should:

1. explain what happened in user language;
2. offer a clear recovery action where possible;
3. preserve entered work when practical.

Technical detail belongs in logs, not the user interface.

---

# 40. State Management

Start simple.

Prefer:

* local component state;
* React hooks;
* server-state patterns appropriate to the application;

before introducing a large global state library.

Add global state management only when a concrete problem justifies it.

Do not install Redux or similar libraries merely because the application may grow later.

---

# 41. Dependency Policy

Before adding a dependency, check:

1. Is it necessary?
2. Does Expo or React Native already provide an adequate solution?
3. Is it actively maintained?
4. Is it compatible with the current Expo version?
5. Does it require custom native configuration?
6. Does it meaningfully increase bundle or maintenance complexity?

Prefer official Expo modules where suitable.

Do not add overlapping libraries solving the same problem.

---

# 42. Code Quality

Use TypeScript rigorously.

Avoid `any` unless there is a specific justified reason.

Prefer:

* explicit domain types;
* discriminated unions;
* small focused functions;
* clear names;
* early validation;
* predictable error structures.

Do not create abstractions solely to appear architecturally sophisticated.

Code should be understandable by another competent developer without extensive explanation.

---

# 43. Naming

Use English for:

* file names;
* variables;
* functions;
* types;
* database fields;
* technical documentation;
* code comments when needed.

Use French for:

* teacher-facing UI;
* student-facing UI;
* educational content generated for French users.

Do not mix French and English naming inside code arbitrarily.

---

# 44. Comments

Do not comment obvious code.

Use comments for:

* non-obvious business decisions;
* security-sensitive reasoning;
* unusual platform workarounds;
* important constraints that future developers might otherwise remove.

Prefer self-explanatory code over excessive comments.

---

# 45. Project Structure

Follow the structure already established in the repository.

If initializing from scratch, prefer clear feature/domain organization over one giant components directory.

Keep clear separation between:

* routes/screens;
* reusable UI;
* domain types;
* backend/API interaction;
* validation schemas;
* application configuration;
* tests.

Avoid premature deep folder hierarchies.

---

# 46. Shared Domain Definitions

Centralize important constants and schemas such as:

* grades;
* subjects;
* quiz types;
* question types;
* API error codes.

Do not maintain independent mobile and backend definitions when they can safely share a canonical representation.

Prevent frontend/backend schema drift.

---

# 47. Database Changes

All database schema changes must be represented through migrations.

Do not rely on undocumented manual changes in the Supabase dashboard.

When changing the database:

1. create/update migration;
2. consider RLS;
3. consider existing data;
4. update relevant types/schemas;
5. test affected flows.

---

# 48. API Design

Keep APIs small and explicit.

Prefer domain-level operations such as:

```text
generate quiz
publish quiz
fetch public quiz
submit quiz
```

over generic endpoints that expose internal database behavior.

Validate requests server-side.

Do not trust client-provided ownership IDs.

Derive authenticated teacher identity from the authenticated session.

---

# 49. Observability

Implement enough observability to diagnose production failures.

Useful technical data can include:

* request identifier;
* operation;
* execution duration;
* broad error category;
* model request success/failure;
* schema-validation failure.

Do not log unnecessary sensitive content.

Avoid storing complete lesson images or secrets in logs.

---

# 50. Testing Philosophy

Test behavior that matters.

Do not chase arbitrary coverage percentages.

High-priority testing targets:

* domain validation;
* quiz schemas;
* authentication;
* authorization;
* RLS;
* AI output parsing;
* publication;
* public quiz retrieval;
* golden teacher-to-student flow.

AI tests should not assert exact wording when output is non-deterministic.

Test structure and invariants instead.

---

# 51. Golden Path

The critical regression scenario is:

```text
Teacher authenticates
        ↓
Creates exercise
        ↓
Selects parameters
        ↓
Adds lesson photo
        ↓
Generates quiz
        ↓
Receives valid structured quiz
        ↓
Edits one question
        ↓
Publishes quiz
        ↓
Receives public URL
        ↓
Student opens URL
        ↓
Student answers quiz
        ↓
Student submits
        ↓
Result displays correctly
```

Protect this path.

Changes touching multiple steps should trigger an appropriate end-to-end check.

---

# 52. Bug Fixing

When fixing a bug:

1. reproduce the issue;
2. identify the root cause;
3. avoid treating only symptoms;
4. make the smallest correct change;
5. add a regression test when practical;
6. verify nearby behavior;
7. avoid unrelated refactoring.

Do not use a bug fix as an excuse to redesign the application.

---

# 53. Refactoring

Refactor when it improves the current product.

Valid reasons include:

* duplication creating real maintenance problems;
* code difficult to test;
* architecture preventing a required feature;
* unclear ownership of logic;
* repeated bugs caused by structure.

Invalid reason:

> "This might be useful when we have 100 times more traffic."

Do not optimize for hypothetical scale.

---

# 54. Performance

The expected MVP scale is modest.

Prioritize:

1. correctness;
2. UX;
3. security;
4. maintainability;
5. cost awareness.

Do not build complex caching, queues or distributed systems prematurely.

Optimize images before network transfer.

Avoid obvious unnecessary rerenders or repeated API requests.

Measure before major optimization work.

---

# 55. Cost Awareness

AI inference is a variable product cost.

Avoid:

* sending unnecessarily huge images;
* repeated model calls;
* unnecessary retries;
* using large-context prompts containing irrelevant information.

However, do not sacrifice educational quality purely to minimize small MVP costs.

When changing model usage significantly, flag likely cost implications.

---

# 56. Git Discipline

Before substantial work:

* inspect existing changes;
* avoid overwriting unrelated user modifications.

Keep commits conceptually focused when commits are requested.

Do not commit:

* secrets;
* `.env` files containing credentials;
* temporary screenshots;
* generated debug artifacts;
* unnecessary large binaries.

Do not rewrite Git history unless explicitly requested.

---

# 57. Existing Code Takes Precedence

When the repository already contains an established pattern that does not violate security or product principles, prefer consistency over inventing a new architecture.

Before adding a new solution:

* search the repo;
* identify similar existing implementations;
* reuse shared utilities where appropriate.

Do not create duplicate service layers or competing conventions.

---

# 58. Handling Ambiguity

Do not ask the project owner to make every implementation decision.

When the choice is:

* low risk;
* reversible;
* conventional;

choose a reasonable default.

When the choice affects:

* product scope;
* user data;
* privacy;
* major recurring cost;
* security;
* irreversible architecture;
* external vendor lock-in;

surface the decision clearly.

---

# 59. Avoid Overengineering

Watch actively for overengineering.

Common warning signs:

* creating interfaces with only one implementation and no realistic second implementation;
* multiple abstraction layers around simple CRUD;
* premature design systems;
* generalized workflow engines;
* generic repository patterns around Supabase;
* custom authentication wrappers that duplicate Supabase;
* complex dependency injection;
* microservices;
* queues without demonstrated need;
* premature caching;
* excessive configuration.

If a straightforward implementation works well, use it.

---

# 60. Do Not Silently Expand Scope

While implementing one feature, do not silently implement adjacent ideas.

Example:

Requested:

> Add quiz sharing.

Correct:

* native share sheet;
* copy link.

Incorrect without explicit request:

* WhatsApp Business API;
* email service;
* contacts import;
* message templates;
* notification tracking.

Stay focused.

---

# 61. Completion Standard

Before saying a feature is complete, verify relevant items from this list:

* feature works;
* TypeScript passes;
* lint passes;
* relevant automated tests pass;
* mobile error state exists;
* loading state exists;
* permissions handled;
* authorization correct;
* secrets safe;
* database migration present if needed;
* RLS updated if needed;
* AI output validated if relevant;
* public/private data separation correct;
* existing golden path not broken.

Do not claim completion when known critical errors remain.

If something cannot be verified in the available environment, state exactly what remains unverified.

---

# 62. Release Priorities

Classify important issues as:

## BLOCKER

Examples:

* secret exposure;
* cross-teacher data access;
* broken authentication;
* public draft exposure;
* corrupted or lost data;
* broken golden path.

## HIGH

Major functionality broken with no reasonable workaround.

## MEDIUM

Incorrect or degraded behavior with a workaround.

## LOW

Minor visual or edge-case issue.

BLOCKER issues take priority over feature development.

---

# 63. Working With the Project Owner

When reporting completed work, keep the explanation practical.

Prefer:

```text
Implemented:
- teacher photo selection
- image preview
- compression before upload
- permission handling

Important decision:
- images are compressed to X before upload to reduce latency while maintaining readable textbook text

Verified:
- TypeScript
- iOS simulator
- failure when permission denied

Not yet verified:
- physical Android camera
```

Avoid dumping every internal code change unless requested.

When there is a problem, explain:

* what is wrong;
* why it matters;
* what you recommend.

---

# 64. Product Copy

Default teacher and student product language is French.

Use concise, natural French.

Avoid robotic AI terminology.

Examples:

Prefer:

```text
Créer un devoir
```

over:

```text
Initialiser une génération
```

Prefer:

```text
Prendre une photo
```

over:

```text
Uploader une image source
```

Prefer:

```text
Le devoir est prêt
```

over:

```text
La génération a été complétée avec succès
```

---

# 65. Definition of MVP Success

The technical MVP is successful when a real teacher can:

1. open the application;
2. authenticate;
3. choose CE2;
4. choose Sciences;
5. photograph a textbook lesson;
6. request 10 mixed questions;
7. receive a coherent quiz based on that lesson;
8. correct or modify a generated question;
9. publish the quiz;
10. share the generated link through WhatsApp, email or ÉcoleDirecte;
11. have a student open the link in a normal browser;
12. have that student complete the exercise without an account.

If this works reliably, prioritize testing with users before expanding the feature set.

---

# 66. Final Decision Rule

When uncertain between two implementation approaches, prefer the one that:

1. keeps the teacher workflow simple;
2. keeps student access frictionless;
3. protects user data;
4. keeps AI calls server-side;
5. preserves educational reliability;
6. requires less infrastructure;
7. uses fewer dependencies;
8. is easier to understand and maintain;
9. is easier to reverse;
10. gets the MVP into real teachers' hands sooner.

Build the smallest reliable product that delivers the core promise.

---
name: supabase-backend-engineer
description: Design and implement the Supabase backend, database, authentication, storage, security policies, Edge Functions and public quiz access. Use whenever work affects server-side logic, data storage, authentication, security or API integrations.
---

# Supabase Backend Engineer

You are responsible for the backend of the application.

The backend must remain simple, secure and inexpensive.

## Stack

Use:

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- Supabase Edge Functions
- Supabase Storage when necessary

## Core rule

Never trust the mobile client.

All privileged operations must be validated server-side.

Never expose:

- LLM API keys
- service role keys
- private prompts
- privileged database credentials

## Authentication

Only teachers require authentication in the MVP.

Students accessing published quizzes do not require accounts.

Use Supabase Auth for teacher authentication.

Do not build custom authentication.

## Initial database model

Prefer a minimal schema.

### profiles

Suggested fields:

- id UUID PRIMARY KEY referencing auth.users
- display_name TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### quizzes

Suggested fields:

- id UUID PRIMARY KEY
- teacher_id UUID
- title TEXT
- grade TEXT
- subject TEXT
- quiz_type TEXT
- status TEXT
- quiz_data JSONB
- public_slug TEXT UNIQUE
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- published_at TIMESTAMPTZ

Prefer storing quiz questions in JSONB during the MVP unless relational storage becomes clearly necessary.

## Quiz status

Use explicit statuses.

Suggested values:

- draft
- published
- archived

Do not expose drafts publicly.

## Public slug

Published quizzes require cryptographically strong, non-sequential public identifiers.

Never use:

/quiz/1
/quiz/2
/quiz/3

Prefer random identifiers such as:

/q/K7fP3xQa

The identifier should be sufficiently difficult to guess.

## Row Level Security

Enable RLS on all private tables.

Teachers may:

- Read their own profile
- Update their own profile
- Read their own quizzes
- Create their own quizzes
- Update their own quizzes
- Delete/archive their own quizzes

Teachers must never access another teacher's private quizzes through authenticated endpoints.

Public access must only expose published quizzes through an intentionally designed public path.

## AI generation endpoint

Implement AI generation server-side.

Conceptual flow:

1. Authenticate teacher.
2. Validate request.
3. Validate grade.
4. Validate subject.
5. Validate quiz type.
6. Validate number of questions.
7. Validate image.
8. Send image and parameters to multimodal LLM.
9. Receive structured response.
10. Validate response using schema.
11. Reject invalid output.
12. Return validated quiz.
13. Optionally save draft.

Never send raw unvalidated LLM output directly to the application.

## Input validation

Validate:

- MIME type
- image size
- supported grade
- supported subject
- supported exercise type
- number of questions
- authentication
- payload size

Reject invalid requests with useful error codes.

## Image lifecycle

Prefer temporary processing.

Desired lifecycle:

Teacher captures image
→ image uploaded or sent for processing
→ LLM analyses image
→ quiz generated
→ source image deleted

Avoid permanent lesson image storage unless explicitly required.

If temporary storage is used, implement cleanup.

## Privacy

The MVP should avoid storing student personal information.

Do not require:

- student name
- student email
- date of birth
- school identifier

Public quiz submissions should initially be anonymous unless product requirements explicitly change.

## Edge Functions

Use Edge Functions for operations requiring secrets or privileged logic.

Examples:

- generate-quiz
- publish-quiz
- retrieve-public-quiz if needed

Keep functions focused.

Avoid creating dozens of micro-functions.

## LLM API secrets

Store API credentials in server-side environment secrets.

Never:

- commit keys
- return keys to clients
- log complete credentials
- embed keys in Expo environment variables exposed to the bundle

## Logging

Log enough information to diagnose failures.

Useful:

- request ID
- teacher ID
- operation
- duration
- LLM status
- validation failure category

Avoid logging:

- full lesson images
- secrets
- unnecessary personal data
- full sensitive prompts when unnecessary

## Error handling

Return predictable error structures.

Example:

{
  "error": {
    "code": "IMAGE_UNREADABLE",
    "message": "The lesson image could not be read reliably."
  }
}

Do not leak stack traces or internal infrastructure details to clients.

## Database migrations

All schema changes must use migrations.

Never rely on undocumented manual database changes.

Keep migrations small and reversible when possible.

## Performance

Do not prematurely optimize.

Expected MVP scale is small.

Prioritize:

- correctness
- security
- simplicity
- observability

over complex scaling architecture.

## Before completing backend work

Verify:

- authentication
- authorization
- RLS
- schema validation
- secret handling
- failure paths
- migration consistency
- public/private data separation
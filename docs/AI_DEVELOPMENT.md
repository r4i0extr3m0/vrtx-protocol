# AI-Assisted Development

## Development workflow

The project uses an AI coding agent as part of the engineering workflow.

**AI coding agent:** Trae

The agent works inside the repository with access to the same source tree and local development tools used by the developer. It proposes or applies focused changes, runs available checks, and reports uncertainty or remaining external setup work.

## What the agent was used for

- Feature implementation across the React Native app and Supabase layer.
- Refactoring and alignment of legacy B2C code with the B2B2C pivot.
- Test creation and test-oriented validation.
- Debugging local setup, migrations, authentication, and deployment issues.
- Documentation and repository maintenance.
- Platform setup, including Supabase migrations, Edge Functions, and Stripe billing foundations.

These statements describe the documented development process. They do not mean that the agent replaces product ownership, security review, or release validation.

## Human responsibilities

The human developer remains responsible for:

- Product requirements and prioritization.
- Architecture and integration decisions.
- Acceptance criteria.
- Security, privacy, and payment decisions.
- Reviewing generated or modified code.
- Running and interpreting validation checks.
- Testing real mobile and production-like flows.
- Managing credentials and external platform accounts.
- Making final merge and release decisions.

Secrets such as Supabase service-role keys, Stripe secret keys, webhook signing secrets, and LLM provider keys are never delegated to the repository or documented as plaintext values.

## Example workflow

```text
Requirement
    |
    v
AI agent implementation
    |
    v
Focused tests and checks
    |
    v
Developer review
    |
    v
Corrections and iteration
    |
    v
CI validation
    |
    v
Merge and release decision
```

## Engineering principles

- Treat repository code and executable checks as stronger evidence than old planning docs.
- Keep changes small enough to review and validate.
- Make security boundaries explicit, especially for tenant data and server-side secrets.
- Mark external dependencies and unfinished launch work clearly.
- Do not describe an aspirational feature as shipped without implementation evidence.

# Architecture Decision Record (ADR) Template

Use this template when documenting architectural decisions.

---

## Template

```markdown
# ADR-[NNN]: [Short Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date

[YYYY-MM-DD]

## Context

[What situation or problem made this decision necessary? Describe the circumstances without getting into the solution yet.]

Questions to answer:
- What problem are we trying to solve?
- What constraints do we have?
- What requirements must be met?

## Decision

[What is the decision? State it clearly in one or two sentences, then provide details.]

We will [do X] because [primary reason].

### Details

[More specifics about the decision]

## Consequences

### Positive

- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Negative

- [Drawback 1]
- [Drawback 2]

### Neutral

- [Neutral consequence that's neither good nor bad]

## Alternatives Considered

### Alternative 1: [Name]

**Description:** [What this option involves]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Why Not Chosen:** [Reason for rejection]

### Alternative 2: [Name]

[Same format as above]

## Implementation Notes

[Any specific guidance for implementing this decision]

## Related Decisions

- [ADR-XXX](./adr-xxx.md) - [How it relates]
- [ADR-YYY](./adr-yyy.md) - [How it relates]
```

---

## Writing Guidelines

### Do
- State the decision clearly upfront
- Explain the context thoroughly
- List all alternatives you considered
- Be honest about trade-offs
- Keep it factual, not promotional

### Don't
- Skip over alternatives
- Hide negative consequences
- Use vague language
- Assume reader knows the context
- Write a novel (keep it focused)

---

## Example: Complete ADR

```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Status

Accepted

## Date

2026-01-21

## Context

We need to choose a primary database for the user management system. The system will:

- Store user profiles and credentials
- Handle authentication sessions
- Track user activity and preferences
- Support 100,000+ users
- Require complex queries for reporting
- Need strong data consistency

Our team has experience with both SQL and NoSQL databases. We have budget for managed database services.

## Decision

We will use PostgreSQL as our primary database because it offers strong data consistency, powerful querying capabilities, and our team has significant experience with it.

### Details

- Use PostgreSQL 15 or later
- Deploy on AWS RDS for managed hosting
- Use connection pooling (PgBouncer) for performance
- Implement read replicas for reporting queries

## Consequences

### Positive

- Strong ACID compliance ensures data integrity
- Powerful query capabilities for complex reports
- Team already knows PostgreSQL well
- Mature ecosystem with good tooling
- Easy to scale vertically for our expected load
- AWS RDS handles backups, updates, and failover

### Negative

- Horizontal scaling is more complex than NoSQL options
- Schema changes require migrations (but this also adds safety)
- Slightly higher operational cost than self-managed options

### Neutral

- We'll need to design our schema carefully upfront
- Standard SQL skills apply (easy to hire for)

## Alternatives Considered

### Alternative 1: MongoDB

**Description:** Use MongoDB as a document database for flexible schema and easy horizontal scaling.

**Pros:**
- Flexible schema, easy to change
- Built-in horizontal scaling
- Good for rapidly evolving data structures

**Cons:**
- Weaker consistency guarantees
- Less powerful for complex queries
- Our team has limited MongoDB experience
- Document model doesn't fit our relational data well

**Why Not Chosen:** Our data is naturally relational (users, sessions, preferences with clear relationships). The team's SQL expertise and our need for strong consistency make PostgreSQL a better fit.

### Alternative 2: MySQL

**Description:** Use MySQL as an alternative SQL database.

**Pros:**
- Similar capabilities to PostgreSQL
- Wide adoption and support
- Some team members have MySQL experience

**Cons:**
- PostgreSQL has better JSON support
- PostgreSQL has more advanced features we might use
- Team's PostgreSQL experience is deeper

**Why Not Chosen:** PostgreSQL offers slight advantages in features and our team is more experienced with it. The databases are similar enough that this was a close call.

### Alternative 3: DynamoDB

**Description:** Use AWS DynamoDB for a fully managed NoSQL solution.

**Pros:**
- Fully managed, zero operational overhead
- Automatic scaling
- Excellent for simple key-value access patterns

**Cons:**
- Limited query capabilities
- Requires different thinking about data modeling
- Complex queries would need workarounds
- Could become expensive at scale

**Why Not Chosen:** Our reporting requirements need complex queries that DynamoDB handles poorly. The cost model also becomes unfavorable for our query patterns.

## Implementation Notes

1. Set up RDS instance with Multi-AZ for high availability
2. Configure automated backups with 7-day retention
3. Use Prisma as our ORM for type-safe database access
4. Implement connection pooling from day one
5. Create read replica before launching reporting features

## Related Decisions

- ADR-002: Authentication Strategy (depends on this database choice)
- ADR-005: Caching Strategy (uses Redis to reduce database load)
```

---

## When to Write an ADR

Write an ADR when you make a decision about:

- Technology choices (languages, frameworks, databases)
- Architecture patterns (microservices, monolith, event-driven)
- Data storage and format
- API design approaches
- Security implementations
- Infrastructure choices
- Integration strategies

You don't need an ADR for:
- Obvious choices with no real alternatives
- Decisions that can be easily reversed
- Minor implementation details

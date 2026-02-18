# Common Mistakes

This file documents common mistakes to avoid. All agents should read this to prevent repeating known issues.

---

## How to Use This File

1. **Before writing code:** Check relevant sections for pitfalls
2. **During code review:** Reference these patterns when reviewing
3. **After fixing a bug:** The Retrospective Agent may add it here

---

## Examples (Read These First)

### Example 1: Async/Promise Mistake

**Category:** Async/Promise Mistakes

**Missing Error Handling in Async Functions**
**What Happens:** Async functions without try/catch cause unhandled promise rejections that crash the process.
**Why It's Bad:** Production outages, silent failures that are hard to debug.
**How to Avoid:** Always wrap async calls in try/catch. Always handle the promise rejection.

```typescript
// Bad
async function getUser(id: string) {
  return db.query('SELECT * FROM users WHERE id = ?', id);
}

// Good
async function getUser(id: string): Promise<User | null> {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = ?', id);
    return result[0] || null;
  } catch (error) {
    console.error(`Failed to get user ${id}:`, error);
    throw new Error(`Database error while fetching user ${id}`);
  }
}
```

---

### Example 2: TypeScript Mistake

**Category:** Code Quality Mistakes

**Using `any` Type Without Justification**
**What Happens:** Code uses `any` type, losing all TypeScript type safety.
**Why It's Bad:** Runtime errors that type checking would catch. Hard to refactor.
**How to Avoid:** Use `unknown` if type is truly unknown, or use generics. Document why `any` was necessary.

```typescript
// Bad
const data: any = response.json();

// Good
interface UserResponse {
  id: string;
  name: string;
}
const data: UserResponse = response.json();

// If truly unknown:
const data: unknown = response.json();
if (isUserResponse(data)) { ... }
```

---

### Example 3: Testing Mistake

**Category:** Testing Mistakes

**No Assertion on Actual Result**
**What Happens:** Test only checks that function runs without throwing, not that output is correct.
**Why It's Bad:** Tests pass even when logic is wrong.
**How to Avoid:** Always assert on specific values, not just "no error."

```typescript
// Bad
test('getUser returns user', async () => {
  const user = await getUser('123');
  // No assertion - test passes regardless
});

// Good
test('getUser returns user with correct id', async () => {
  const user = await getUser('123');
  expect(user).toBeDefined();
  expect(user.id).toBe('123');
  expect(user.name).toBe('John');
});
```

---

### Example 4: Security Mistake

**Category:** Security Mistakes

**SQL Injection via String Interpolation**
**What Happens:** User input directly concatenated into SQL query.
**Why It's Bad:** Attacker can steal, modify, or delete all data.
**How to Avoid:** Always use parameterized queries.

```typescript
// Bad
const query = `SELECT * FROM users WHERE name = '${username}'`;

// Good - parameterized
const query = 'SELECT * FROM users WHERE name = ?';
const result = await db.query(query, [username]);
```

---

### Example 5: Documentation Mistake

**Category:** Documentation Mistakes

**No Examples in Documentation**
**What Happens:** Docs explain WHAT but not HOW. Users can't copy-paste.
**Why It's Bad:** Users struggle to implement. More support requests.
**How to Avoid:** Every API/method must have a code example.

```typescript
// Bad
/**
 * Processes user data
 * @param user - The user data to process
 */
function processUser(user: User): ProcessedUser

// Good
/**
 * Processes user data into normalized format
 * @param user - The user data to process
 * @returns Processed user with normalized fields
 *
 * @example
 * const user = { name: 'JOHN', email: 'JOHN@EXAMPLE.COM' };
 * const processed = processUser(user);
 * // processed = { name: 'John', email: 'john@example.com' }
 */
function processUser(user: User): ProcessedUser
```

---

## Template for New Entries

Copy the format above when adding new mistakes.

```markdown
## [Category] Mistakes

### [Mistake Name]
**What Happens:** [Description of the mistake]
**Why It's Bad:** [Consequence of making this mistake]
**How to Avoid:** [Prevention steps]
**Example:**
```[language]
// Bad
[bad code]

// Good
[good code]
```
```

---

## Security Mistakes

<!-- Add entries above -->

## Code Quality Mistakes

<!-- Add entries above -->

## Async/Promise Mistakes

<!-- Add entries above -->

## Testing Mistakes

<!-- Add entries above -->

## Documentation Mistakes

<!-- Add entries above -->

## Database/ORM Mistakes

<!-- Add entries above -->

## API Migration Mistakes

<!-- Add entries above -->

## Infrastructure Script Mistakes

<!-- Add entries above -->

---

*This file is automatically updated by the Retrospective Agent after each project completion.*

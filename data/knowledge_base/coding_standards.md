# Coding Standards

This file defines coding standards that all agents should follow when writing code.

---

## How to Use This File

1. **Implementation Agent:** Follow these standards when writing code
2. **Code Reviewer:** Check code against these standards
3. **Retrospective Agent:** Add new standards discovered during projects

---

## Examples (Read These First)

### Example 1: Function Naming

**Standard:** Use verb + noun for function names

**Why:** Clear action + target

```typescript
// Good
function getUserData(userId: string): UserData
function validateEmail(email: string): boolean
function calculateTotal(items: CartItem[]): number

// Bad
function user(id: string) // What does this DO?
function check(email: string) // Check WHAT?
function process(items) // Process HOW?
```

---

### Example 2: File Organization

**Standard:** One primary export per file, co-located types

**Why:** Easy to find, clear responsibility

```typescript
// Good - user.service.ts
export class UserService { ... }
export interface User { ... }
export interface UserQuery { ... }

// Bad - utils.ts
export class UserService { ... }
export function formatDate() { ... }
export const CONFIG = { ... }
// Too many different things in one file
```

---

### Example 3: Error Handling

**Standard:** Always handle errors explicitly, never swallow

**Why:** Silent failures are the hardest to debug

```typescript
// Good
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw new UserFetchError(`Failed to fetch user ${id}`, error);
  }
}

// Bad
async function fetchUser(id: string): Promise<User> {
  try {
    return (await api.get(`/users/${id}`)).data;
  } catch {
    return null; // What went wrong? We don't know now.
  }
}
```

---

### Example 4: TypeScript Strictness

**Standard:** Never use `any`. Use `unknown` if type is truly unknown.

**Why:** Type safety is the main benefit of TypeScript

```typescript
// Good
interface ApiResponse {
  data: User[];
  status: number;
}

// If parsing unknown JSON:
const parsed = JSON.parse(jsonString) as unknown;

// Bad
const data: any = response.json(); // Loses all type safety
```

---

### Example 5: Function Length

**Standard:** Maximum 50 lines per function

**Why:** Shorter functions are easier to test, debug, and understand

```typescript
// Good - focused function
function calculateOrderTotal(items: CartItem[]): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  return subtotal + tax + shipping;
}

// Bad - too long, does multiple things
function processOrder(order: Order): Receipt {
  // 50 lines of validation
  // 30 lines of inventory check
  // 40 lines of payment processing
  // 20 lines of email sending
  // ...too much!
}
```

---

### Example 6: Comment Standards

**Standard:** Explain WHY, not WHAT. Code shows what, comments explain reasoning.

**Why:** Future developers (including AI) need context, not restating the obvious

```typescript
// Good
// Retry 3 times with exponential backoff because the external API
// rate-limits on rapid consecutive requests.
async function callApiWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    // ...
  }
}

// Bad
// Loop 3 times
for (let i = 0; i < 3; i++) { ... }
```

---

## Template for New Entries

Copy the format above when adding new standards. Include: **Rule**, **Rationale**, and **Example** (code snippet).

```markdown
### [Standard Name]

**[Rule]:** [What to do]

**[Why]:** [Rationale]

```typescript
// Good
[good code example]

// Bad
[bad code example]
```
```

---

## Universal Standards

### Naming Conventions

<!-- Add entries above -->

### File Organization

<!-- Add entries above -->

### Code Limits

<!-- Add entries above (e.g. function length, file length, nesting) -->

---

## TypeScript/JavaScript Standards

<!-- Add entries above -->

## Python Standards

<!-- Add entries above -->

## Shell Script Standards

<!-- Add entries above -->

## Comment Standards

<!-- Add entries above -->

## Security Standards

<!-- Add entries above -->

---

*This file is automatically updated by the Retrospective Agent after each project completion.*

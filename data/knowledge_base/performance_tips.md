# Performance Tips

This file contains performance optimization tips learned from completed projects.

---

## How to Use This File

1. **Code Architect:** Consider these when designing systems
2. **Implementation Agent:** Apply relevant optimizations
3. **Code Reviewer:** Check for performance anti-patterns
4. **Retrospective Agent:** Add new tips discovered during projects

---

## Examples (Read These First)

### Example 1: Database Performance

**Problem:** Slow queries on large tables
**Solution:** Add indexes on frequently queried columns
**Impact:** 10-100x faster queries

```sql
-- Bad: Full table scan on every query
SELECT * FROM orders WHERE user_id = 123;

-- Good: Index makes this O(1) instead of O(n)
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

### Example 2: API Performance

**Problem:** Multiple sequential API calls causing slow response
**Solution:** Batch requests or use concurrent promises
**Impact:** 5-10x faster response times

```typescript
// Bad: Sequential - waits for each request
const user = await fetchUser(userId);
const posts = await fetchPosts(userId);
const settings = await fetchSettings(userId);

// Good: Concurrent - all requests in parallel
const [user, posts, settings] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchSettings(userId)
]);
```

---

### Example 3: JavaScript/Node.js Performance

**Problem:** Unnecessary object creation in loops
**Solution:** Reuse objects, use generators for large datasets
**Impact:** Reduced memory pressure, faster execution

```typescript
// Bad: Creates new array every iteration
const results = items.map(item => {
  const transformed = { ...item, processed: true }; // New object each time
  return transformed;
});

// Good: Process in place or use generator for large data
for (const item of items) {
  item.processed = true;
}

// Or for streaming large data:
function* processItems(items: Item[]): Generator<ProcessedItem> {
  for (const item of items) {
    yield transformItem(item);
  }
}
```

---

### Example 4: Caching Performance

**Problem:** Repeated expensive computations
**Solution:** Cache results with TTL
**Impact:** Near-instant responses for cached data

```typescript
// Good: Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

async function getUser(id: string): Promise<User> {
  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const user = await db.fetchUser(id);
  cache.set(id, { data: user, expires: Date.now() + 60000 });
  return user;
}
```

---

### Example 5: Frontend Performance

**Problem:** Unnecessary re-renders in UI frameworks
**Solution:** Use proper memoization, limit re-renders
**Impact:** Smoother UI, faster interactions

```typescript
// React example - Bad
function UserList({ users, filter }) {
  // Re-renders every time parent re-renders, even if data unchanged
  return (
    <ul>
      {users.filter(u => u.name.includes(filter)).map(u => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

// React example - Good
const UserList = React.memo(function UserList({ users, filter }) {
  // Only re-renders when users or filter actually changes
  const filteredUsers = useMemo(
    () => users.filter(u => u.name.includes(filter)),
    [users, filter]
  );
  return (
    <ul>
      {filteredUsers.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
});
```

---

### Example 6: Memory Performance

**Problem:** Loading entire datasets into memory
**Solution:** Use streaming/pagination for large data
**Impact:** Constant memory usage regardless of data size

```typescript
// Bad: Loads all rows into memory
const allUsers = await db.query('SELECT * FROM users');

// Good: Stream results
const stream = db.query('SELECT * FROM users').stream();
for await (const user of stream) {
  processUser(user); // One at a time, constant memory
}
```

---

## Template for New Entries

Copy the format above when adding new tips. Include: **Problem**, **Solution**, **Impact**, **Example** (optional).

```markdown
### [Category] Performance

**Problem:** [What causes slow performance]
**Solution:** [How to fix it]
**Impact:** [Quantified improvement if possible]

```[language]
// Before optimization
[code]

// After optimization
[code]
```
```

---

## Database Performance

<!-- Add tips above -->

## API Performance

<!-- Add tips above -->

## JavaScript/Node.js Performance

<!-- Add tips above -->

## Streamlit/Data App Performance

<!-- Add tips above -->

## Load Balancing Performance

<!-- Add tips above -->

## Frontend Performance

<!-- Add tips above -->

## Memory Performance

<!-- Add tips above -->

---

*This file is automatically updated by the Retrospective Agent after each project completion.*

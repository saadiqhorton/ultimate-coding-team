# Feature Documentation Template

Use this template when documenting features in projects.

---

## Template

```markdown
# [Feature Name]

## What This Does

[One paragraph explaining what the feature does in simple terms. No jargon. No analogies. If you must use a technical term, explain it immediately after.]

Example:
> The authentication system handles user login and keeps accounts secure.
> When someone tries to log in, it checks their username and password
> against what's stored in the database. If everything matches, it creates
> a special access token that proves they're allowed to use the system.

## Why It Matters

[Explain why this feature exists. What problem does it solve? What happens without it?]

Example:
> Without proper authentication, anyone could access private user data
> or make changes they shouldn't be allowed to make. This system makes
> sure only the right people can get in, and it tracks who did what.

## How to Use It

[Step-by-step numbered instructions. Be specific. Include code examples where helpful.]

### [Use Case 1: Common Scenario]

1. [Step 1]
   ```[language]
   [code example if needed]
   ```

2. [Step 2]

3. [Step 3]

### [Use Case 2: Another Scenario]

1. [Step 1]
2. [Step 2]

## How It Works

[Technical explanation in simple language. Describe the actual process, not analogies.]

Example:
> The system never stores actual passwords - that would be a security risk.
> Instead, it stores a "hashed" version. Hashing means running the password
> through a special formula that creates a unique string of characters.
> This formula can't be reversed, so even if someone sees the hash, they
> can't figure out the original password.
>
> When you log in:
> 1. You enter your password
> 2. The system runs it through the same hashing formula
> 3. It compares the result to what's stored
> 4. If they match, your password was correct

## Configuration

[List any configuration options]

| Option | What It Does | Default Value |
|--------|--------------|---------------|
| [option_name] | [description] | [value] |

## Error Handling

[List common errors and what to do about them]

### [Error Name or Code]

**What It Means:** [Plain explanation]
**What Causes It:** [Common causes]
**How to Fix It:** [Steps to resolve]

## Related Features

- [Related Feature 1](./related-feature-1.md) - [one line description]
- [Related Feature 2](./related-feature-2.md) - [one line description]

## Technical Reference

[Optional: More detailed technical information for developers]

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| [path] | [GET/POST/etc] | [what it does] |

### Data Flow

```
[Simple diagram if helpful]
```
```

---

## Writing Guidelines

### Do
- Use simple, clear language
- Explain technical terms when you use them
- Keep sentences short (under 20 words)
- Use numbered steps for instructions
- Include real code examples
- Explain "why" not just "what"

### Don't
- Use jargon without explanation
- Use analogies ("like a bouncer at a club...")
- Write long, complex sentences
- Assume the reader knows everything
- Skip over important details
- Use vague instructions ("configure properly")

---

## Example: Complete Feature Doc

```markdown
# Password Reset

## What This Does

The password reset feature lets users create a new password if they forget their current one. It sends a special link to their email that lets them set a new password.

## Why It Matters

People forget passwords. Without this feature, locked-out users would need to contact support and wait for manual help. This feature lets users fix the problem themselves, any time of day.

## How to Use It

### Requesting a Password Reset

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email for a message from us
6. Click the link in the email (it expires in 1 hour)
7. Enter your new password
8. Click "Reset Password"

### Setting a Strong Password

Your new password must:
- Be at least 8 characters long
- Include at least one number
- Include at least one special character (like ! or @)

## How It Works

1. **You request a reset** - The system generates a random token (a long string of characters) and saves it with your account.

2. **Email is sent** - We send an email containing a link with this token. The link looks like: `https://example.com/reset?token=abc123xyz`

3. **Token verification** - When you click the link, the system checks if the token matches what it saved, and if it's less than 1 hour old.

4. **Password update** - If the token is valid, you can set a new password. The system hashes it and saves it to your account.

5. **Cleanup** - The token is deleted so it can't be used again.

## Configuration

| Option | What It Does | Default |
|--------|--------------|---------|
| TOKEN_EXPIRY | How long the reset link works | 3600 (1 hour) |
| MAX_REQUESTS | Reset requests allowed per hour | 3 |

## Error Handling

### "Invalid or expired link"

**What It Means:** The reset link is no longer valid.
**What Causes It:** The link is more than 1 hour old, or it's already been used.
**How to Fix It:** Request a new password reset.

### "Too many requests"

**What It Means:** You've requested too many resets recently.
**What Causes It:** More than 3 reset requests in one hour.
**How to Fix It:** Wait an hour and try again. If you're not making these requests, someone might be trying to access your account - contact support.

## Related Features

- [Authentication](./authentication.md) - How logging in works
- [Account Security](./account-security.md) - Other ways to protect your account
```

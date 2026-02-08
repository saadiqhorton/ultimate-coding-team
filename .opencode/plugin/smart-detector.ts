/**
 * Smart Detector Plugin for OpenCode
 *
 * This plugin analyzes user requests and suggests using the full workflow
 * when complex coding tasks are detected.
 */

// Keywords that suggest a complex task requiring full workflow
const COMPLEX_KEYWORDS = [
  'build',
  'create',
  'implement',
  'develop',
  'refactor',
  'redesign',
  'migrate',
  'architect',
  'new feature',
  'add feature',
  'api',
  'endpoint',
  'database',
  'schema',
  'authentication',
  'authorization',
  'security',
  'integration',
  'comprehensive',
  'complete',
  'full',
  'production',
];

// Keywords that suggest a simple task (skip full workflow)
const SIMPLE_KEYWORDS = [
  'typo',
  'rename',
  'comment',
  'tweak',
  'explain',
  'what is',
  'how does',
  'show',
  'status',
  'minor',
  'small',
  'quick',
  'single',
];

type WorkflowType = 'complex' | 'simple' | 'unknown';

interface DetectionResult {
  type: WorkflowType;
  suggestion: string;
  matchedKeywords: string[];
}

/**
 * Check if request contains any of the given keywords
 */
function containsKeyword(request: string, keywords: string[]): string[] {
  const requestLower = request.toLowerCase();
  return keywords.filter((keyword) => requestLower.includes(keyword));
}

/**
 * Detect the workflow type based on request content
 */
function detectWorkflowType(request: string): DetectionResult {
  // Check for simple keywords first (they take precedence)
  const simpleMatches = containsKeyword(request, SIMPLE_KEYWORDS);
  if (simpleMatches.length > 0) {
    return {
      type: 'simple',
      suggestion:
        'This appears to be a simple task. Proceeding directly without full workflow.',
      matchedKeywords: simpleMatches,
    };
  }

  // Check for complex keywords
  const complexMatches = containsKeyword(request, COMPLEX_KEYWORDS);
  if (complexMatches.length > 0) {
    return {
      type: 'complex',
      suggestion:
        'This appears to be a complex coding task. Consider using the full AI Coding Team workflow. Read: skills/system-orchestrator/SKILL.md',
      matchedKeywords: complexMatches,
    };
  }

  // Default to unknown
  return {
    type: 'unknown',
    suggestion:
      'Unable to determine task complexity. For new features or multi-file changes, consider the full workflow. Read: skills/system-orchestrator/SKILL.md',
    matchedKeywords: [],
  };
}

/**
 * Calculate complexity score for more nuanced detection
 */
function calculateComplexityScore(request: string): number {
  const requestLower = request.toLowerCase();
  let score = 0;

  // Score based on keywords
  const scores: { [key: string]: number } = {
    'new feature': 40,
    'add feature': 40,
    build: 35,
    create: 30,
    implement: 30,
    develop: 30,
    architect: 30,
    security: 30,
    authentication: 30,
    database: 25,
    schema: 25,
    api: 20,
    endpoint: 20,
    refactor: 15,
    test: 10,
  };

  for (const [keyword, keywordScore] of Object.entries(scores)) {
    if (requestLower.includes(keyword)) {
      score += keywordScore;
    }
  }

  return score;
}

/**
 * Plugin hook for pre-prompt processing
 */
export function prePromptHook(userRequest: string): void {
  const result = detectWorkflowType(userRequest);
  const score = calculateComplexityScore(userRequest);

  console.log(`[Smart Detector] Workflow type: ${result.type}`);
  console.log(`[Smart Detector] Complexity score: ${score}`);
  console.log(`[Smart Detector] ${result.suggestion}`);

  if (result.matchedKeywords.length > 0) {
    console.log(
      `[Smart Detector] Matched keywords: ${result.matchedKeywords.join(', ')}`
    );
  }
}

/**
 * Get workflow recommendation
 */
export function getWorkflowRecommendation(userRequest: string): {
  useFullWorkflow: boolean;
  reason: string;
  score: number;
} {
  const score = calculateComplexityScore(userRequest);
  const threshold = 50;

  return {
    useFullWorkflow: score >= threshold,
    reason:
      score >= threshold
        ? 'Request complexity suggests using the full 10-agent workflow'
        : 'Request appears simple enough for direct handling',
    score,
  };
}

// Export for testing
export { detectWorkflowType, calculateComplexityScore, COMPLEX_KEYWORDS, SIMPLE_KEYWORDS };

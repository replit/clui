export interface ScoredMatchResult {
  score: number;
}

interface SimpleMatchParams {
  searchValue: string;
  currentSearchDepth: number;
}

export function simpleMatch(
  value: string,
  { searchValue, currentSearchDepth }: SimpleMatchParams
): ScoredMatchResult | null {
  if (!searchValue && currentSearchDepth !== 0) {
    return null;
  }

  const valueLower = value.toLowerCase();
  const searchValueLower = searchValue.toLowerCase();

  if (valueLower.startsWith(searchValueLower)) {
    return { score: 1 };
  }

  if (valueLower.includes(searchValueLower)) {
    return { score: 0.5 };
  }

  return null;
}

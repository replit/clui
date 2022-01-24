import { Token, CommandNode, Command } from './types';

export function createCommandNodePath<D, M>(
  commands: Array<{ value: string; command: Command<D, M> }>
) {
  const path: Array<CommandNode<D, M>> = [];

  for (const { value, command } of commands) {
    const prev = path.length ? path[path.length - 1] : null;
    const start = prev ? prev.token.end + 1 : 0;

    const token = { value, start, end: start + value.length };

    path.push({
      command,
      token,
      parent: prev,
    });
  }

  return path;
}

function pathToString(path: Array<{ token: Token }>) {
  const values: Array<string> = [];

  for (const { token } of path) {
    // Don't include "" (root node)
    if (token.value) {
      values.push(token.value);
    }
  }

  return values.join(' ');
}

export function getFullValue(
  path: Array<{ token: Token }>,
  inputValue: string
) {
  const fullValue = pathToString(path);

  if (fullValue) {
    // Append inputValue to sub-command
    return `${fullValue} ${inputValue}`;
  }

  // We're at the root so the fullValue is the same as the inputValue
  return inputValue;
}

interface SortByExistingParams<K, V> {
  /**
   * The existing array to match the order of
   */
  existing: Array<V>;
  /**
   * The key used to compare objects
   */
  getKey: (item: V) => K;
}

/**
 * Returns a new array ordered by matching the order of an existing
 * array if possible. Useful for avoiding UI jumps when updating options
 * for a dropdown
 */
export default function sortByExisting<V, K = string>(
  incomming: Array<V>,
  { existing, getKey }: SortByExistingParams<K, V>
) {
  const incommingMap = new Map<K, V>();
  for (const item of incomming) {
    incommingMap.set(getKey(item), item);
  }

  const seenKeys = new Set<K>();
  const items: Array<V> = [];

  for (const item of existing) {
    const key = getKey(item);
    const match = incommingMap.get(key);

    if (!match) {
      continue;
    }

    items.push(match);
    seenKeys.add(key);
  }

  for (const item of incomming) {
    if (seenKeys.has(getKey(item))) {
      continue;
    }

    items.push(item);
  }

  return items;
}

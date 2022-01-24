import { Token } from '../types';
import { getFullValue } from '../util';

export interface Selection {
  start: number;
  end: number;
}

export interface KeydownAction {
  type: 'keydown';
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
  selectionStart: number | null;
  selectionEnd: number | null;
}

interface PartialState {
  selection: null | Selection;
  matchedPath: Array<{ token: Token }>;
  inputValue: string;
}

export function keydownReducer<State extends PartialState>(
  state: State,
  action: KeydownAction
): State {
  const { matchedPath, selection } = state;

  if (action.key === 'a' && matchedPath.length && action.metaKey) {
    // Select all
    return {
      ...state,
      selection: {
        start: 0,
        end: matchedPath.length,
      },
    };
  }

  if (
    action.key === 'Backspace' &&
    selection &&
    selection.start < matchedPath.length
  ) {
    // Delete selected commands (backspace w/ selection)
    const { selectionStart, selectionEnd } = action;

    const newMatchedPath = matchedPath.slice(0, selection.start);

    const inputValue =
      typeof selectionStart === 'number' && typeof selectionEnd === 'number'
        ? state.inputValue.slice(selectionEnd)
        : state.inputValue;

    const fullValue = getFullValue(newMatchedPath, inputValue);

    return {
      ...state,
      // Delete highlighted range
      selection: null,
      matchedPath: newMatchedPath,
      inputValue,
      fullValue,
    };
  }

  if (action.key === 'ArrowLeft' && action.shiftKey && action.metaKey) {
    // Highlight all for left arrow + meta + shift
    return {
      ...state,
      selection: { start: 0, end: matchedPath.length },
    };
  }

  if (
    action.key === 'ArrowLeft' &&
    action.shiftKey &&
    action.selectionStart === 0 &&
    matchedPath.length
  ) {
    // Highlight previous block for left arrow + shift
    const start = selection
      ? // If there's a current virtualSelection decrement start index
        Math.max(selection.start - 1, 0)
      : matchedPath.length - 1;

    return { ...state, selection: { start, end: matchedPath.length } };
  }

  if (
    action.key === 'ArrowLeft' &&
    !selection &&
    action.selectionStart === 0 &&
    matchedPath.length
  ) {
    // Left arrow behaves like backspace when cursor is placed at the begining of input
    const newMatchedPath = matchedPath.slice(0, matchedPath.length - 1);

    const inputValue = '';
    const fullValue = getFullValue(newMatchedPath, inputValue);

    return {
      ...state,
      inputValue,
      fullValue,
      matchedPath: newMatchedPath,
    };
  }

  const selectionAtStart = action.selectionStart === 0;

  if (
    selectionAtStart &&
    (action.key === 'ArrowLeft' || action.key === 'Backspace') &&
    matchedPath.length > 1
  ) {
    // Delete previous command (backspace at start on input)
    const newMatchedPath = matchedPath.slice(0, matchedPath.length - 1);

    const inputValue = '';
    const fullValue = getFullValue(newMatchedPath, inputValue);

    return {
      ...state,
      inputValue,
      fullValue,
      matchedPath: newMatchedPath,
      isLoading: true,
    };
  }

  if (action.key === 'ArrowRight' && action.shiftKey && selection) {
    // Clear or increment virtualSelection start index on "right arrow + shift"
    const start = selection.start + 1;

    return {
      ...state,
      selection: start === selection.end ? null : { start, end: selection.end },
    };
  }

  if (action.key === 'ArrowRight' && selection) {
    // Clear virtualSelection if we get to this state
    return { ...state, selection: null };
  }

  return state;
}

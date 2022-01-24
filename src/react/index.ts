import {
  useEffect,
  useCallback,
  useReducer,
  useRef,
  KeyboardEvent,
} from 'react';

import { createCompleter } from '../completer';
import {
  Command,
  CommandNode,
  CommandNodePath,
  MatchFn,
  Option,
  UpdateData,
} from '../types';
import sortByExisting, { createCommandNodePath, getFullValue } from '../util';

import { Selection, keydownReducer, KeydownAction } from './keyboard';

type Completer = ReturnType<typeof createCompleter>;

type Action<Data, MatchResult> =
  | {
      type: 'inputValue';
      inputValue: string;
    }
  | {
      type: 'clear';
      inputValue?: string;
      matchedPath: CommandNodePath<Data, MatchResult>;
    }
  | {
      type: 'selectPath';
      inputValue?: string;
      isLoading: boolean;
      matchedPath: CommandNodePath<Data, MatchResult>;
    }
  | {
      type: 'updateData';
      updateData: UpdateData<Data, MatchResult>;
    }
  | KeydownAction;

interface State<D, M> {
  inputValue: string;
  fullValue: string;
  matchedPath: Array<CommandNode<D, M>>;
  options: Array<Option<D, M>>;
  isLoading: boolean;
  selection: null | Selection;
}

type SortFn<Data, MatchResult> = (
  a: Option<Data, MatchResult>,
  b: Option<Data, MatchResult>
) => number;

function createReducer<Data, MatchResult>(sort: SortFn<Data, MatchResult>) {
  return function reducer(
    state: State<Data, MatchResult>,
    action: Action<Data, MatchResult>
  ): State<Data, MatchResult> {
    switch (action.type) {
      case 'inputValue': {
        const { inputValue } = action;

        const fullValue = getFullValue(state.matchedPath, inputValue);

        return {
          ...state,
          isLoading: true,
          inputValue,
          fullValue,
        };
      }

      case 'selectPath': {
        const { inputValue = '', matchedPath, isLoading } = action;

        const fullValue = getFullValue(matchedPath, inputValue);

        return {
          ...state,
          isLoading,
          matchedPath,
          inputValue,
          fullValue,
        };
      }

      case 'updateData': {
        const { searchValue, options, matchedPath } = action.updateData;

        const suffix = state.inputValue.endsWith(' ')
          ? state.inputValue.slice(state.inputValue.lastIndexOf(' '))
          : '';
        const inputValue = searchValue + suffix;

        const fullValue = getFullValue(state.matchedPath, inputValue);

        return {
          isLoading: false,
          options: sortByExisting(options.sort(sort), {
            existing: state.options,
            getKey: (o) => o.value,
          }),
          matchedPath,
          inputValue,
          fullValue,
          selection: null,
        };
      }
      case 'keydown': {
        return keydownReducer(state, action);
      }
    }

    return state;
  };
}

interface InitProps<Data, MatchResult> {
  root: Command<Data, MatchResult>;
  initialValue?: string;
  initialCommandPath?: Array<{
    value: string;
    command: Command<Data, MatchResult>;
  }>;
}

function initState<Data, MatchResult>({
  initialValue = '',
  initialCommandPath,
  root,
}: InitProps<Data, MatchResult>): State<Data, MatchResult> {
  const matchedPath = createCommandNodePath<Data, MatchResult>([
    { value: '', command: root },
    ...(initialCommandPath || []),
  ]);

  const fullValue = getFullValue(matchedPath, initialValue);

  return {
    inputValue: initialValue,
    fullValue,
    matchedPath,
    options: [],
    isLoading: Boolean(initialValue || initialCommandPath),
    selection: null,
  };
}

interface Props<Data, MatchResult> extends InitProps<Data, MatchResult> {
  matchOption: MatchFn<Data, MatchResult>;
  sortOptions: SortFn<Data, MatchResult>;
}

export function useCompleter<Data, MatchResult>({
  root,
  matchOption,
  sortOptions,
  initialValue,
  initialCommandPath,
}: Props<Data, MatchResult>) {
  const reducer = createReducer<Data, MatchResult>(sortOptions);
  const [state, dispatch] = useReducer(
    reducer,
    { root, initialValue, initialCommandPath },
    initState
  );

  const completerRef = useRef<null | Completer>(null);

  useEffect(() => {
    completerRef.current = createCompleter({
      root,
      onUpdate: (updateData) => {
        dispatch({ type: 'updateData', updateData });
      },
      matchOption,
    });
  }, [root]);

  useEffect(() => {
    if (!completerRef.current) {
      return;
    }

    completerRef.current({
      value: state.fullValue,
    });
  }, [state.fullValue]);

  const updateInputValue = useCallback(
    (inputValue: string) => {
      dispatch({ type: 'inputValue', inputValue });
    },
    [dispatch]
  );

  const selectPath = useCallback(
    (
      matchedPath: Array<CommandNode<Data, MatchResult>>,
      options: { inputValue?: string } = {}
    ) => {
      if (!completerRef.current) {
        return;
      }

      dispatch({
        type: 'selectPath',
        matchedPath,
        inputValue: options.inputValue,
        isLoading: true,
      });
    },
    []
  );

  const clear = useCallback(() => {
    if (!completerRef.current) {
      return;
    }

    dispatch({
      type: 'selectPath',
      matchedPath: createCommandNodePath([{ value: '', command: root }]),
      isLoading: false,
    });

    completerRef.current({
      value: '',
    });
  }, [root]);

  const handleKeydown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!completerRef.current) {
        // Do nothing if called on initial render
        return;
      }

      if (event.key === 'Escape') {
        // Blur on escape
        event.currentTarget.blur();

        return;
      }

      const { selectionStart, selectionEnd } = event.currentTarget;

      dispatch({
        type: 'keydown',
        key: event.key,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        selectionStart,
        selectionEnd,
      });
    },
    []
  );

  const isIndexSelected = useCallback(
    (index: number) =>
      Boolean(
        state.selection &&
          index >= state.selection.start &&
          index < state.selection.end
      ),
    [state.selection]
  );

  return {
    isLoading: state.isLoading,
    matchedPath: state.matchedPath,
    inputValue: state.inputValue,
    options: state.options,
    updateInputValue,
    selectPath,
    clear,
    handleKeydown,
    isIndexSelected,
  };
}

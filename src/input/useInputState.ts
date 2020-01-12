import { useReducer, useCallback, useRef, useEffect } from 'react';
import { ICommand, ISuggestion } from './types';
import { inputState, IInputState } from './asyncState';

type Updates = Partial<{ value: string; index: number }>;

type Action = {
  type: 'UPDATE';
  updates: Partial<IRState>;
};

interface IOptions {
  command: ICommand;
  value?: string;
  index?: number;
}

interface IState extends Omit<IInputState, 'update'> {
  options: Array<ISuggestion>;
  loading: boolean;
}

type Updater = (updates: Updates) => void;

interface IRState extends IState {
  loading: boolean;
  options: Array<ISuggestion>;
}

const reducer = (state: IRState, action: Action) => {
  switch (action.type) {
    case 'UPDATE':
      return {
        ...state,
        ...action.updates,
      };
    default:
      return state;
  }
};

const toState = (input: IInputState): Omit<IState, 'options' | 'loading'> => ({
  value: input.value,
  index: input.index,
  runnable: input.runnable,
  exhausted: input.exhausted,
  nodeStart: input.nodeStart,
  run: input.run,
});

const useInputState = (options: IOptions): [IState, Updater] => {
  const input = useRef<IInputState | null>(null);
  const [state, dispatch] = useReducer(reducer, {
    value: options.value || '',
    index: options.index || 0,
    loading: false,
    options: [],
    runnable: false,
    exhausted: false,
  });

  useEffect(() => {
    input.current = inputState({
      command: options.command,
      value: options.value,
      index: options.index,
      onOptions: (updates) => {
        dispatch({ type: 'UPDATE', updates });
      },
    });
  }, [dispatch, options.index, options.value, options.command]);

  const update = useCallback((updates: Updates) => {
    if (input.current) {
      input.current.update(updates);
      dispatch({
        type: 'UPDATE',
        updates: toState(input.current),
      });
    }
  }, []);

  return [state, update];
};

export default useInputState;

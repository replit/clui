import { useReducer, useCallback, useRef, useEffect } from 'react';
import { ICommand } from './types';
import { inputState, IInputStateUpdates } from './asyncState';

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

type Updater = (updates: Updates) => void;

interface IRState extends IInputStateUpdates {
  value: string;
  index: number;
  loading: boolean;
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

const useInputState = (options: IOptions): [IRState, Updater] => {
  const input = useRef<Updater | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    value: options.value || '',
    index: options.index || 0,
    options: [],
    loading: false,
    exhausted: false,
  });

  useEffect(() => {
    input.current = inputState({
      command: options.command,
      value: options.value,
      index: options.index,
      onUpdate: (updates) => {
        dispatch({ type: 'UPDATE', updates: { loading: false, ...updates } });
      },
    });
  }, [dispatch, options.index, options.value, options.command]);

  const update = useCallback((updates: Updates) => {
    if (input.current) {
      input.current(updates);
      dispatch({ type: 'UPDATE', updates: { loading: true, ...updates } });
    }
  }, []);

  return [state, update];
};

export default useInputState;

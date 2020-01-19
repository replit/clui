import { useReducer, useCallback, useRef } from 'react';
import { ICommand } from './types';
import { inputState, IInputStateUpdates } from './state';

type Updates = Partial<{ value: string; index: number }>;

type Action = {
  type: 'UPDATE';
  updates: Partial<IState>;
};

interface IOptions<C extends ICommand = ICommand> {
  command: C;
  value?: string;
  index?: number;
}

type Updater = (updates: Updates) => void;

interface IState extends IInputStateUpdates {
  value: string;
  index: number;
  loading: boolean;
}

const reducer = (state: IState, action: Action) => {
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

const useInputState = (options: IOptions): [IState, Updater] => {
  const input = useRef<Updater | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    value: options.value || '',
    index: options.index || 0,
    options: [],
    loading: false,
    exhausted: false,
  });

  if (!input.current) {
    input.current = inputState({
      command: options.command,
      value: options.value,
      index: options.index,
      onUpdate: (updates) => {
        dispatch({ type: 'UPDATE', updates: { loading: false, ...updates } });
      },
    });
  }

  const update = useCallback(
    (updates: Updates) => {
      if (input.current) {
        const different: Updates = {};

        if (updates.value !== undefined && updates.value !== state.value) {
          different.value = updates.value;
        }

        if (updates.index !== undefined && updates.index !== state.index) {
          different.index = updates.index;
        }

        if (!Object.keys(different).length) {
          return;
        }

        input.current(different);
        dispatch({ type: 'UPDATE', updates: { loading: true, ...different } });
      }
    },
    [dispatch, state.value, state.index],
  );

  return [state, update];
};

export default useInputState;

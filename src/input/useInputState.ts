import { useReducer, useMemo, useCallback } from 'react';
import { ICommand } from './types';
import { inputState, IInputState } from './state';

interface IState extends Omit<IInputState, 'update'> {
  // value: string;
  // index: number;
  // runnable: boolean;
  // exhausted: boolean;
  // suggestions: Array<ISuggestion>;
  input: IInputState;
}

type Action = {
  type: 'UPDATE';
  updates: Partial<{ value: string; index: number }>;
};

const reducer = (state: IState, action: Action) => {
  switch (action.type) {
    case 'UPDATE':
      state.input.update(action.updates);

      return {
        ...state,
        ...action.updates,
        runnable: state.input.runnable,
        exhausted: state.input.exhausted,
        suggestions: state.input.suggestions,
        run: state.input.run,
      };
    default:
      return state;
  }
};

interface IUpdates {
  index?: number;
  value?: string;
}

const useInputState = (
  cmds: Record<string, ICommand>,
): [Omit<IState, 'input' | 'update'>, (updates: Action['updates']) => void] => {
  const input = useMemo(() => inputState(cmds), [cmds]);

  const [state, dispatch] = useReducer(reducer, {
    value: '',
    index: 0,
    input,
    suggestions: input.suggestions,
    runnable: input.runnable,
    exhausted: input.exhausted,
  });

  const update = useCallback((updates: IUpdates) => dispatch({ type: 'UPDATE', updates }), [
    dispatch,
  ]);

  return [
    {
      value: state.value,
      index: state.index,
      suggestions: state.suggestions,
      runnable: state.runnable,
      exhausted: state.exhausted,
      run: state.run,
    },
    update,
  ];
};

export default useInputState;

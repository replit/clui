import React, { useReducer, useMemo, useCallback } from 'react';
import reducer, { Action, State } from './reducer';

export interface CLUISessionItem<S = {}> {
  session?: CLUISession<S>;
}

export interface CLUISession<S = {}> {
  next: () => any;
  reset: () => any;
  remove: () => any;
  replace: (node: React.ReactElement) => any;
  insert: (...nodes: Array<React.ReactElement>) => any;
  currentIndex: number;
  length: number;
  state: S;
  setState<K extends keyof S>(
    state:
      | ((prevState: Readonly<S>) => Pick<S, K> | S | null)
      | (Pick<S, K> | S | null),
  ): void;
}

interface Props<S> extends CLUISessionItem<S> {
  onDone?: () => any;
  children: React.ReactNode;
  initialIndex?: number;
  initialState?: S;
}

function Session<S = {}>(props: Props<S>) {
  const children = useMemo(
    () => React.Children.toArray(props.children).filter(React.isValidElement),
    [props.children],
  );

  const [state, dispatch] = useReducer<React.Reducer<State<S>, Action<S>>>(
    reducer,
    {
      currentIndex:
        props.initialIndex !== undefined
          ? Math.min(props.initialIndex, children.length - 1)
          : 0,
      nodes: children.map((_, index) => index),
      state: props.initialState,
    },
  );

  const nodes = useMemo(
    () =>
      state.nodes.reduce(
        (acc: Array<React.ReactElement>, node: React.ReactElement | number) => {
          if (typeof node !== 'number') {
            acc.push(node);
          } else if (typeof node === 'number' && children[node]) {
            acc.push(children[node]);
          }

          return acc;
        },
        [],
      ),
    [state, children],
  );

  const currentNodes = useMemo(() => nodes.slice(0, state.currentIndex + 1), [
    nodes,
    state.currentIndex,
  ]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', nodes: children });
  }, [dispatch]);

  const setState: CLUISession['setState'] = useCallback(
    newState => {
      dispatch({
        type: 'SET_STATE',
        state:
          typeof newState === 'function' ? newState(state.state) : newState,
      });
    },
    [dispatch],
  );

  const session = useCallback<(i: number) => CLUISession>(
    (index: number) => {
      return {
        next: () => {
          if (state.currentIndex !== index) {
            return;
          }

          if (nodes[index + 1]) {
            dispatch({ type: 'SET_INDEX', index: index + 1 });

            return;
          }

          if (index === nodes.length - 1) {
            if (props.onDone) {
              props.onDone();
            }

            if (props.session) {
              props.session.next();
            }
          }
        },
        insert: (...nodes: Array<React.ReactElement>) => {
          if (state.currentIndex !== index) {
            return;
          }

          dispatch({ type: 'INSERT', nodes, index: index + 1 });
        },
        replace: (node: React.ReactElement) => {
          dispatch({ type: 'REPLACE', index, node });
        },
        remove: () => {
          dispatch({ type: 'REMOVE', index });
        },
        setState,
        reset,
        state: state.state,
        currentIndex: state.currentIndex,
        length: nodes.length,
      };
    },
    [
      dispatch,
      reset,
      props.session,
      props.onDone,
      state.currentIndex,
      nodes,
      currentNodes,
    ],
  );

  return (
    <>
      {React.Children.map(currentNodes, (element, index) =>
        React.cloneElement(element, { session: session(index) }),
      )}
    </>
  );
}

export default Session;

import React, { useReducer, useMemo, useEffect, useCallback } from 'react';

export interface CLUISessionItem {
  session?: CLUISession;
}

export interface CLUISession {
  next: () => any;
  reset: () => any;
  insert: (...els: Array<React.ReactElement>) => any;
  currentIndex: number;
  length: number;
}

interface State {
  currentIndex: number;
  nodes: Array<React.ReactElement | number>;
}

type Action =
  | {
      type: 'SET_INDEX';
      index: number;
    }
  | {
      type: 'INSERT';
      index: number;
      nodes: Array<React.ReactElement>;
    }
  | {
      type: 'RESET';
      nodes: Array<React.ReactElement>;
    };

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'SET_INDEX':
      return {
        ...state,
        currentIndex: action.index,
      };
    case 'INSERT':
      return {
        nodes: [
          ...state.nodes.slice(0, action.index),
          ...action.nodes,
          ...state.nodes.slice(action.index),
        ],
        currentIndex: state.currentIndex + 1,
      };
    case 'RESET':
      return {
        nodes: action.nodes,
        currentIndex: 0,
      };
    default:
      return state;
  }
};

interface Props extends CLUISessionItem {
  onDone?: () => any;
  children: React.ReactNode;
  initialIndex?: number;
}

const Session = (props: Props) => {
  const children = useMemo(
    () => React.Children.toArray(props.children).filter(React.isValidElement),
    [props.children],
  );

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: props.initialIndex || 0,
    nodes: children.map((_, index) => index),
  });

  const nodes = useMemo(
    () =>
      state.nodes.reduce((acc: Array<React.ReactElement>, node) => {
        if (typeof node !== 'number') {
          acc.push(node);
        } else if (typeof node === 'number' && children[node]) {
          acc.push(children[node]);
        }

        return acc;
      }, []),
    [state, children],
  );

  const currentNodes = useMemo(() => nodes.slice(0, state.currentIndex + 1), [
    nodes,
    state.currentIndex,
  ]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', nodes: children });
  }, [dispatch]);

  const session = useCallback<(i: number) => CLUISession>(
    (index: number) => ({
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
      reset,
      currentIndex: state.currentIndex,
      length: nodes.length,
    }),
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
};

export default Session;

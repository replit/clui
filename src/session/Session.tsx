import React, {
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import reducer, { Action, State } from './reducer';

export interface ISessionItemProps<S = {}> {
  item?: ISessionItem<S>;
}

export interface ISession<C = any> {
  reset: () => void;
  currentIndex: number;
  length: number;
  context: C;
}

export interface ISessionItem<C = any> {
  index: number;
  next: () => ISessionItem;
  previous: () => ISessionItem;
  remove: () => ISessionItem;
  replace: (node: React.ReactElement) => ISessionItem;
  insertAfter: (...nodes: Array<React.ReactElement>) => ISessionItem;
  insertBefore: (...nodes: Array<React.ReactElement>) => ISessionItem;
  session: ISession<C>;
}

interface Props<C> extends ISessionItemProps<C> {
  onDone?: () => any;
  children: React.ReactNode;
  initialIndex?: number;
  context?: C;
}

function Session<C = any>(props: Props<C>) {
  const children = useMemo(
    () => React.Children.toArray(props.children).filter(React.isValidElement),
    [props.children],
  );

  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, {
    currentIndex:
      props.initialIndex !== undefined
        ? Math.min(props.initialIndex, children.length - 1)
        : 0,
    nodes: children.map((_, index) => index),
  });

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
    [state.nodes, children],
  );

  const currentNodes = useMemo(() => nodes.slice(0, state.currentIndex + 1), [
    nodes,
    state.currentIndex,
  ]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', nodes: children });
  }, [dispatch]);

  const session = useMemo<ISession>(
    () => ({
      reset,
      currentIndex: state.currentIndex,
      length: nodes.length,
      context: props.context,
    }),
    [nodes.length, reset, state.currentIndex, props.context],
  );

  const item = useCallback<(i: number) => ISessionItem>(
    (index: number) => {
      let indexOffset = 0;
      let lengthOffset = 0;

      const ret = {
        next: () => {
          dispatch({
            type: 'SET_INDEX',
            index: index + indexOffset + 1,
          });

          return ret;
        },
        previous: () => {
          dispatch({
            type: 'SET_INDEX',
            index: index + indexOffset - 1,
          });

          return ret;
        },
        insertAfter: (...nodes: Array<React.ReactElement>) => {
          dispatch({ type: 'INSERT_AFTER', nodes, index });
          lengthOffset += nodes.length;

          return ret;
        },
        insertBefore: (...nodes: Array<React.ReactElement>) => {
          indexOffset += nodes.length;
          lengthOffset += nodes.length;
          dispatch({ type: 'INSERT_BEFORE', nodes, index });

          return ret;
        },
        replace: (node: React.ReactElement) => {
          dispatch({ type: 'REPLACE', index, node });

          return ret;
        },
        remove: () => {
          lengthOffset -= 1;
          dispatch({ type: 'REMOVE', index });

          return ret;
        },
        get index() {
          return index + indexOffset;
        },
        get session() {
          return {
            ...session,
            length: session.length + lengthOffset,
          };
        },
      };

      return ret;
    },
    [
      dispatch,
      props.onDone,
      state.currentIndex,
      nodes,
      currentNodes,
      props.item,
      session,
    ],
  );

  useEffect(() => {
    if (state.currentIndex < nodes.length - 1) {
      return;
    }

    if (props.onDone) {
      props.onDone();
    }

    if (props.item) {
      props.item.next();
    }
  }, [props.onDone, props.item, nodes.length, state.currentIndex]);

  return (
    <>
      {React.Children.map(currentNodes, (element, index) =>
        React.cloneElement(element, { item: item(index) }),
      )}
    </>
  );
}

export default Session;

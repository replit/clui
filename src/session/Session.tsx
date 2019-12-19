/*
 * Session is a component that manages when a list of child elements
 * are displayed. Each child receives an item prop that contains
 * methods and properties related to navigating and transforming the list.
 */

import React, { useReducer, useMemo, useCallback, useEffect } from 'react';
import reducer, { Action, State } from './reducer';

/*
 * An interfce for child element `Props` to extend.
 *
 * ```
 * interface Props extends ISessionItemProps {};
 *
 * const Item: React.FC<Props> = (props) => (
 *   <button onClick={props.item ? props.item.next : undefined}/>next</button>
 * );
 * ```
 */
export interface ISessionItemProps<S = {}> {
  item?: ISessionItem<S>;
}

/*
 * An object containing methods and properties related to a `Session` instance.
 * In the following case each `Session` component has its own `session` object.
 *
 * ```
 * <Session>
 *   <Item />
 *   <Item />
 *   <Session>
 *     <Item />
 *     <Item />
 *   </Session>
 * </Session>
 * ```
 */
export interface ISession<C = any> {
  reset: () => void;
  currentIndex: number;
  length: number;
  context: C;
}

/*
 * An object containing methods and properties related to an child item
 * of a `Session` instance. These methods and properties are relative to
 * the item. For example, calling next multiple times on and item will
 * show the next child if it's not shown and otherwise have no effect.
 */
export interface ISessionItem<C = any> {
  /*
   * The index of the element in the list.
   */
  index: number;

  /*
   * Shows the next item if the item is the last displayed item and there
   * is at least 1 more item following it. Calling `next` on the last possible
   * item will call the `onDone` handler passed to parent `Session` component.
   */
  next: () => ISessionItem;

  /*
   * Shows the previous item if the item is the last displayed item and there
   * is at least 1 more item preceding it.
   */
  previous: () => ISessionItem;

  /*
   * Removes the element and sets index to previous value
   * displayed item and there is at least 1 more item preceding it.
   */
  remove: () => ISessionItem;

  /*
   * Replaces element with another element.
   */
  replace: (node: React.ReactElement) => ISessionItem;

  /*
   * Inserts 1 or more element after but does not display them (you can call
   * `next` afer inserting to show the first inserted element)
   */
  insertAfter: (...nodes: Array<React.ReactElement>) => ISessionItem;

  /*
   * Inserts 1 or more element before.
   */
  insertBefore: (...nodes: Array<React.ReactElement>) => ISessionItem;

  /*
   * A reference to the session object (shared across items in the list).
   */
  session: ISession<C>;
}

/*
 * Props for `Session` component. Extends `ISessionItemProps` so sessions can
 * be nested.
 */
interface Props<C> extends ISessionItemProps<C> {
  /*
   * Called when `next` is called on last item
   */
  onDone?: () => any;
  /*
   * One or more React elements
   */
  children: React.ReactElement | Array<React.ReactElement>;
  /*
   * Show all elements up to and including this index (defaults to 0)
   */
  initialIndex?: number;
  /*
   * An optional value that will be available to every item at `item.session.context`
   */
  context?: C;
}

/*
 * A component to wrap child elements. By default it will display the first child.
 *
 * ```
 * <Session>
 *  <div>shown</div>
 *  <div>not shown</div>
 * </Session>
 * ```
 *
 * The child elements have logic for doing something then calling a method on
 * `props.item` to advance to the next element (or modify the list in some other way)
 *
 * To initially show more then the first child use the`initialIndex` prop.
 *
 * ```
 * <Session initialIndex={1}>
 *  <div>shown</div>
 *  <div>shown</div>
 * </Session>
 * ```
 */
function Session<C = any>(props: Props<C>) {
  const children = useMemo(
    () => React.Children.toArray(props.children).filter(React.isValidElement),
    [props.children],
  );

  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, {
    currentIndex:
      props.initialIndex !== undefined ? Math.min(props.initialIndex, children.length - 1) : 0,
    nodes: children.map((_, index) => index),
  });

  const nodes = useMemo(
    () =>
      state.nodes.reduce((acc: Array<React.ReactElement>, node: React.ReactElement | number) => {
        if (typeof node !== 'number') {
          acc.push(node);
        } else if (typeof node === 'number' && children[node]) {
          acc.push(children[node]);
        }

        return acc;
      }, []),
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
    [dispatch, props.onDone, state.currentIndex, nodes, currentNodes, props.item, session],
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

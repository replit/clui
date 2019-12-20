/**
 * Manages the state for a `Session`
 */
import React from 'react';

type Nodes = Array<React.ReactElement | number>;
type Elements = Array<React.ReactElement>;

/**
 * The state for a `Session`
 */
export interface IState {
  /**
   * All child elements up to and including this index are rendered.
   */
  currentIndex: number;

  /**
   * Conatains all nodes (either dynamically inserted elements or a mapping
   * the index of a passed in child.
   */
  nodes: Nodes;
}

export type Action =
  | {
      type: 'SET_INDEX';
      index: number;
    }
  | {
      type: 'INSERT';
      index: number;
      nodes: Elements;
    }
  | {
      type: 'INSERT_AFTER';
      index: number;
      nodes: Elements;
    }
  | {
      type: 'INSERT_BEFORE';
      index: number;
      nodes: Elements;
    }
  | {
      type: 'REMOVE';
      index: number;
    }
  | {
      type: 'REPLACE';
      index: number;
      node: React.ReactElement;
    }
  | {
      type: 'RESET';
      nodes: Elements;
    };

const replace = (state: IState, index: number, node: React.ReactElement) => {
  const nodes = [...state.nodes];
  nodes[index] = node;

  return { ...state, nodes };
};

const remove = (state: IState, index: number) => {
  const filterdNodes = state.nodes.filter((_, i) => i !== index);

  return {
    ...state,
    currentIndex:
      state.currentIndex > filterdNodes.length - 1 ? filterdNodes.length - 1 : state.currentIndex,
    nodes: filterdNodes,
  };
};

const reducer = (state: IState, action: Action) => {
  switch (action.type) {
    case 'REPLACE':
      return replace(state, action.index, action.node);
    case 'REMOVE':
      return remove(state, action.index);
    case 'SET_INDEX':
      return {
        ...state,
        currentIndex: Math.max(Math.min(action.index, state.nodes.length - 1), 0),
      };
    case 'INSERT':
      return {
        ...state,
        nodes: [
          ...state.nodes.slice(0, action.index),
          ...action.nodes,
          ...state.nodes.slice(action.index),
        ],
        currentIndex: state.currentIndex + 1,
      };
    case 'INSERT_BEFORE':
      return {
        ...state,
        currentIndex: state.currentIndex + action.nodes.length,
        nodes: [
          ...state.nodes.slice(0, action.index),
          ...action.nodes,
          ...state.nodes.slice(action.index),
        ],
      };
    case 'INSERT_AFTER':
      return {
        ...state,
        nodes: [
          ...state.nodes.slice(0, action.index + 1),
          ...action.nodes,
          ...state.nodes.slice(action.index + 1),
        ],
      };
    case 'RESET':
      return {
        ...state,
        nodes: action.nodes,
        currentIndex: 0,
      };
    default:
      return state;
  }
};

export default reducer;

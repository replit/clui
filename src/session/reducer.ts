import React from 'react';

export interface State {
  currentIndex: number;
  nodes: Array<React.ReactElement | number>;
}

export type Action =
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
      type: 'INSERT_AFTER';
      index: number;
      nodes: Array<React.ReactElement>;
    }
  | {
      type: 'INSERT_BEFORE';
      index: number;
      nodes: Array<React.ReactElement>;
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
      nodes: Array<React.ReactElement>;
    };

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'REPLACE':
      const nodes = [...state.nodes];
      nodes[action.index] = action.node;

      return { ...state, nodes };
    case 'REMOVE':
      return {
        ...state,
        nodes: state.nodes.filter((_, i) => i !== action.index),
        currentIndex: action.index - 1,
      };
    case 'SET_INDEX':
      return {
        ...state,
        currentIndex: Math.max(
          Math.min(action.index, state.nodes.length - 1),
          0,
        ),
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

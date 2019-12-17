import React from 'react';

export interface State<S> {
  state: S;
  currentIndex: number;
  nodes: Array<React.ReactElement | number>;
}

export type Action<S> =
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
      type: 'REMOVE';
      index: number;
    }
  | {
      type: 'REPLACE';
      index: number;
      node: React.ReactElement;
    }
  | {
      type: 'SET_STATE';
      state: S;
    }
  | {
      type: 'RESET';
      nodes: Array<React.ReactElement>;
    };

const reducer = <S>(state: State<S>, action: Action<S>) => {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        state: {
          ...state.state,
          ...action.state,
        },
      };
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
        currentIndex: action.index,
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

import React, { useReducer, useMemo } from "react";

export interface CLUISessionItem {
  session?: CLUISession;
}

export interface CLUISession {
  next: () => any;
}

interface State {
  currentIndex: number;
  nodes: Array<React.ReactElement | number>;
}

type Action =
  | {
      type: "SET_INDEX";
    }
  | {
      type: "NEXT";
    };

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "NEXT":
      return {
        ...state,
        currentIndex: state.currentIndex + 1
      };
    default:
      return state;
  }
};

interface Props {
  children: React.ReactNode;
  initialIndex?: number;
}

const Session = (props: Props) => {
  const children = useMemo(
    () => React.Children.toArray(props.children).filter(React.isValidElement),
    [props.children]
  );

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: props.initialIndex || 0,
    nodes: children.map((_, index) => index)
  });

  const nodes = useMemo(
    () =>
      state.nodes.reduce((acc: Array<React.ReactElement>, node) => {
        if (typeof node !== "number") {
          acc.push(node);
        } else if (typeof node === "number" && children[node]) {
          acc.push(children[node]);
        }

        return acc;
      }, []),
    [state, children]
  );

  const activeNodes = useMemo(
    () =>
      React.Children.map(nodes.slice(0, state.currentIndex + 1), element => {
        const next = () => dispatch({ type: "NEXT" });

        return React.cloneElement(element, { session: { next } });
      }),
    [nodes, state.currentIndex]
  );

  return <>{activeNodes}</>;
};

export default Session;

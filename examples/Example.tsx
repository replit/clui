import React from 'react';
import { parse, getNode } from '../src/parser';
import { IResult } from '../src/parser/types';

// const useAfterUpdate = () => {
// const after = React.useRef<() => void | null>(null);

// React.useLayoutEffect(() => {
// if (after.current) {
// after.current();
// after.current = null;
// }
// });

// const runAtfer = (fn: () => void) => {
// after.current = fn;
// };

// return runAtfer;
// };

const Example = () => {
  const input = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');
  const [cursor, setCursor] = React.useState(0);
  // const [currentNode, setCurrentNode] = React.useState<INode | null>(null);
  // const afterUpdate = useAfterUpdate();

  const parsed = React.useRef<IResult | null>(null);

  React.useEffect(() => {
    console.log('setting parsed.current');
    parsed.current = parse(value);
  }, [value, parsed]);

  const currentNode = React.useMemo(() => {
    console.log('setting currentNodes');
    if (!parsed.current) {
      return null;
    }

    return getNode(parsed.current.result.value, cursor);
  }, [cursor, parsed]);

  const onKeyUp = React.useCallback(() => {
    if (input.current) {
      console.log('onKeyUp');
      setCursor(input.current.selectionStart);
    }
  }, [input]);

  // React.useEffect(() => {
  // const current = getNode(parsed.result.value, cursor) || null;
  // console.log({ cursor, current });
  // afterUpdate(() => {
  // console.log(2, { cursor, current });
  // setCurrentNode(current);
  // });
  // }, [cursor, parsed]);

  React.useEffect(() => {
    console.log({ cursor });
  }, [cursor]);

  React.useEffect(() => {
    console.log({ currentNode });
  }, [currentNode]);

  return (
    <div style={{ padding: 40 }}>
      <input
        value={value}
        onKeyUp={onKeyUp}
        onChange={(e) => setValue(e.target.value)}
        ref={input}
      />
      <pre style={{ fontSize: 10 }}>
        <code>
          {JSON.stringify(
            {
              cursor,
              currentNode,
            },
            null,
            2,
          )}
        </code>
        <code>{JSON.stringify(parsed, null, 2)}</code>
      </pre>
    </div>
  );
};

export default Example;

import React from 'react';

export default (props) => {
  console.log('props');

  return (
    <div>
      <pre>
        <code>{JSON.stringify(props, null, 2)}</code>
      </pre>
    </div>
  );
};

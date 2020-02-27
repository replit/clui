# CLUI Session

A utility for manipulating a list of React children.

When building a CLI-style interfaces this can be useful for adding and removing lines when the prompt is submitted. Each child receives an item prop that contains methods and properties related to navigating and transforming the list. By default only the first child is rendered. It's up to the child elements to call a method on `props.item` to update the list. The child elements can be insered dynamically, defined up-front or a mix of both.

## Basic Prompt/Output example

Here's an exmaple that renders an input and a button. When the button is clicked, 2 components are added (not rendered) to the list by calling `item.insert(/* ... */).next()`. By chaining `next()` the next child is rendered, which is `<Output value={value} />`. By passing `value` to `Output` it can render something based on it. The only requirement for `Output` is to call `props.item.next()` at some point to show the next `Prompt`. This could be after fetching data, a user interaction, or right when the component mounts (`useEffect(() => props.item.next(), [])`.

```jsx
import React, { useState } from 'react'
import { render } from 'react-dom'
import Session from '@replit/clui-session';

// Substitute for somehting more interesting!
const useFetchData = (value) => {
  return value;
}

const Output = (props) => {
  // Do something interesting with prompt input value
  const data = useFetchData(props.value);

  useEffect(() => {
    if (data) {
      // After data has loaded, call `next` to show next child (which is another Prompt)
      props.item.next();
    }
  }, [data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  // Render output data
  return <div>output: ${data}</div>,
}

const Prompt = (props) => {
  const [value, setValue] = useState('');

  const onClick = () => {
    props.item.insert(
      <Output value={value} />,
      <Prompt />,
    ).next();
  }

  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)}/>
      <button onClick={onClick}>run</button>
    <div>;
  );
}

render(
  <Session>
    <Prompt />
  </Session>,
  document.getElementById('root'),
);


/* After typing "hello session" and clicking run on the output
 * the component tree would look like
 *
 * <Session>
 *   <Prompt />
 *   <Output value="hello session" />
 *   <Prompt />
 * </Session>
 */
```

## Components

### <Step />

`Step` is a utility component that automatically shows the next child by calling `item.next` when the component mounts

```jsx
<Session>
  <Step><div>step 1</div></Step>
  <Step wait={2000}><div>step 2 (paused for 1 second)</div></Step>
  <Step wait={2000}><div>step 3 (paused for 1 second)</div></Step>
  <Step><div>step 4</div></Step>
</Session>
```

### <Do />

`Do` is a utility component the gives you access to `item` inline as a [render prop](https://reactjs.org/docs/render-props.html).

```jsx
<Session>
  <Do>
    {item => <button onClick={item.next}>next 1</button>}
  </Do>
  <Do>
    {item => <button onClick={item.next}>next 2</button>}
  </Do>
  <Do>
    {item => <button onClick={item.next}>next 3</button>}
  </Do>
</Session>
```

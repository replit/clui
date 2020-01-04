import React, { PropsWithChildren } from 'react';
import { Session, Step, ISessionItemProps } from '../src';

export const Nexter = (props: PropsWithChildren<ISessionItemProps>) => (
  <button type="button" onClick={props.item ? props.item.next : undefined}>
    {props.children}
  </button>
);

const Box = ({ color, item }: ISessionItemProps & { color: string }) => (
  <button
    style={{ backgroundColor: color, padding: 20 }}
    type="button"
    onClick={item ? item.next : undefined}
  >
    click me
  </button>
);

export const Boxes = ({ colors }: { colors: Array<string> }) => (
  <Session>
    {colors.map((color) => (
      <Box color={color} />
    ))}
  </Session>
);

export const Typing = ({ text, speed }: { text: string; speed: number }) => (
  <Session>
    {text.split('').map((char) => (
      <Step wait={speed}>{char}</Step>
    ))}
  </Session>
);

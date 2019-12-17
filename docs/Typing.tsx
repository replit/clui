import * as React from 'react';
import { CLUISessionItem } from '../src/session/Session';
import { Session, Wait } from '../src/session';

interface Props extends CLUISessionItem {
  text: string;
  speed?: number;
}

export const Typing = ({ session, text, speed = 10 }: Props) => {
  const items = text.split('').map((s, i) => (
    <Wait key={s + i} time={speed}>
      {s}
    </Wait>
  ));

  return <Session onDone={session ? session.next : undefined}>{items}</Session>;
};

export default Typing;

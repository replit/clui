import * as React from 'react';
import { SessionItem } from './Session';

interface Props extends SessionItem {
  children?: React.ReactNode;
  time?: number;
}

const Wait = ({ children, session, time }: Props) => {
  React.useEffect(() => {
    const timer = session ? setTimeout(session.next, time || 200) : undefined;

    return () => timer && clearTimeout(timer);
  }, []);

  if (!children) {
    return null;
  }

  return <>{children}</>;
};

export default Wait;

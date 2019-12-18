import * as React from 'react';
import { SessionItem } from './Session';

const Step: React.FC<SessionItem> = ({ session, children }) => {
  React.useEffect(() => {
    if (session) {
      session.next();
    }
  }, []);

  return <>{children}</>;
};

export default Step;

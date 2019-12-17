import * as React from 'react';
import { CLUISessionItem } from './Session';

const Step: React.FC<CLUISessionItem> = ({ session, children }) => {
  React.useEffect(() => {
    if (session) {
      session.next();
    }
  }, []);

  return <>{children}</>;
};

export default Step;

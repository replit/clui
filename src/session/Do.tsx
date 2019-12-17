import * as React from 'react';
import { CLUISessionItem, CLUISession } from './Session';

interface Props extends CLUISessionItem {
  children: (session?: CLUISession) => React.ReactElement<any>;
}

const Do = ({ session, children }: Props) => children(session);

export default Do;

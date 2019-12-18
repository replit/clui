import * as React from 'react';
import { SessionItem, Session } from './Session';

interface Props extends SessionItem {
  children: (session?: Session) => React.ReactElement<any>;
}

const Do = ({ session, children }: Props) => children(session);

export default Do;

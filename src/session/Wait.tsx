import * as React from 'react';
import { ISessionItemProps } from './Session';

interface Props extends ISessionItemProps {
  /*
   * Content to render
   */
  children?: React.ReactNode;
  /*
   * Amount of time in milliseconds to wait before showing next child
   */
  time?: number;
}

/*
 * `Wait` is a utility component that shows the next chiid after `time`
 *
 * ```
 * <Session>
 *   <Wait time={1000}>
 *      Hello
 *   </Wait>
 *   <Wait time={1000}>
 *      World
 *   </Wait>
 * </Session>
 * ```
 *
 */
const Wait = ({ children, item, time }: Props) => {
  React.useEffect(() => {
    const timer = item ? setTimeout(item.next, time || 200) : undefined;

    return () => timer && clearTimeout(timer);
  }, []);

  if (!children) {
    return null;
  }

  return <>{children}</>;
};

export default Wait;

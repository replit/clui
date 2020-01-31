import * as React from 'react';
import { ISessionItemProps } from './Session';

interface IProps extends ISessionItemProps {
  /**
   * Amount of time in milliseconds to wait before showing next child
   */
  wait?: number;

  /**
   * Content to render
   */
  children?: React.ReactNode;
}

/**
 * `Step` is a utility component that automatically shows the next child
 * by calling `item.next` when the component mounts
 *
 * ```
 * <Session>
 *   <Step>
 *    shown
 *   </Step>
 *   <Step wait={1000}>
 *    shown for 1 second
 *   </Step>
 *   <div>
 *    shown
 *   </div>
 *   <div>
 *     NOT shown
 *   </div>
 * </Session>
 * ```
 *
 */
const Step: React.FC<IProps> = ({ item, wait, children }: IProps) => {
  React.useEffect(() => {
    if (!item) {
      return;
    }

    if (!wait) {
      item.next();

      return;
    }

    const timer = setTimeout(item.next, wait);

    /* eslint-disable-next-line consistent-return */
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
};

export default Step;

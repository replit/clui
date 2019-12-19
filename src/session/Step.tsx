import * as React from "react";
import { ISessionItemProps } from "./Session";

/*
 * `Step` is a utility component that automatically shows the next child
 * by calling `item.next` when the component mounts
 *
 * ```
 * <Session>
 *   <Step>
 *    shown
 *   </Step>
 *   <Step>
 *    shown
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
const Step: React.FC<ISessionItemProps> = ({ item, children }) => {
  React.useEffect(() => {
    if (item) {
      item.next();
    }
  }, []);

  return <>{children}</>;
};

export default Step;

import * as React from "react";
import { ISessionItem, ISessionItemProps } from "./Session";

interface Props extends ISessionItemProps {
  children: (item: ISessionItem) => React.ReactElement<any>;
}

/*
 * `Do` is a utility component the gives you access to `item` inline
 *
 * ```
 * <Session>
 *   <Do>
 *     {item => <button onClick={item.next}>next</button>}
 *   </Do>
 *   <Do>
 *     {item => <button onClick={item.next}>next</button>}
 *   </Do>
 * </Session>
 * ```
 *
 */
const Do = ({ item, children }: Props) => {
  if (!item) {
    throw Error("`Do` must be rendered as a direct child of a `Session`");
  }

  return children(item);
};

export default Do;

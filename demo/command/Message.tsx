import React from 'react';
import { ISessionItemProps, IRunOptions } from '../../src';

interface IProps extends ISessionItemProps, IRunOptions {
  children: React.ReactNode;
}

export const Success = (props: IProps) => {
  React.useEffect(() => {
    if (props.item) {
      props.item.next();
    }
  }, []);

  return (
    <div className="root">
      <div className="icon">✔</div>
      {props.children}
      <style jsx>{`
        .root {
          display: flex;
        }
        .icon {
          color: var(--success-foreground);
          flex: 0 0 auto;
          margin-right: 10px;
        }
      `}</style>
    </div>
  );
};

const Message = (props: IProps) => {
  React.useEffect(() => {
    if (props.item) {
      props.item.next();
    }
  }, []);

  return <div>{props.children}</div>;
};

export default Message;

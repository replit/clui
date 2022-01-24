import * as React from 'react';
import { Place } from './places';

export function Block(props: {
  label: string;
  active: boolean;
  onRemoveClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onTextClick: () => void;
}) {
  return (
    <div className={`Block ${props.active ? 'active' : 'inactive'}`}>
      <div onClick={() => props.onTextClick()}>{props.label}</div>
      <XButton onClick={props.onRemoveClick} />
    </div>
  );
}

export function Prompt(props: { children: React.ReactNode }) {
  return <div className="Prompt">{props.children}</div>;
}

export function XButton(props: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button className="XButton" onClick={props.onClick}>
      <span>X</span>
    </button>
  );
}

export function Menu({ children, ...props }: { children: React.ReactNode }) {
  return (
    <div className="Menu" {...props}>
      {children}
    </div>
  );
}

export function MenuItem(props: {
  icon?: JSX.Element;
  heading: string;
  label: string;
  description?: string;
  active?: boolean;
}) {
  return (
    <div className={`MenuItem ${props.active ? 'active' : 'inactive'}`}>
      {props.icon ? <div className="icon">{props.icon}</div> : null}
      <div>
        <div className="heading">{props.heading}</div>
        <div>{props.label}</div>
        {props.description ? (
          <div className="description">{props.description}</div>
        ) : null}
      </div>
    </div>
  );
}

export function InputBlock(props: {
  children: React.ReactNode;
  iconRight?: JSX.Element;
  hasSubCommands: boolean;
}) {
  return (
    <div
      className={`InputBlock ${
        props.hasSubCommands ? 'has-subcommands' : undefined
      }`}
    >
      {props.children}
      {props.iconRight ? (
        <div className="iconRight">{props.iconRight}</div>
      ) : null}
    </div>
  );
}

export function Map(props: { place: Place }) {
  return (
    <iframe
      width="100%"
      height="350"
      frameBorder="0"
      scrolling="no"
      marginHeight={0}
      marginWidth={0}
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${props.place.embedCode}&amp;layer=mapnik`}
    />
  );
}

export function Output(props: { children: React.ReactNode; dimmed: boolean }) {
  return (
    <div className={`Output ${props.dimmed ? 'dimmed' : undefined}`}>
      {props.children}
    </div>
  );
}

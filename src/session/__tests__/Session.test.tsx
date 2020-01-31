import * as React from 'react';
import { shallow } from 'enzyme';
import Session, { ISessionItem } from '../Session';

describe('Session', () => {
  it('renders element', () => {
    const a = <i className="a" />;
    const wrapper = shallow(<Session>{a}</Session>);

    expect(wrapper.find('.a')).toHaveLength(1);
  });

  it('renders first element', () => {
    const a = <i className="a" />;
    const b = <i className="b" />;
    const wrapper = shallow(
      <Session>
        {a}
        {b}
      </Session>,
    );

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);
  });

  it('renders elements up to initialIndex', () => {
    const a = <i className="a" />;
    const b = <i className="b" />;
    const c = <i className="c" />;
    const wrapper = shallow(
      <Session initialIndex={1}>
        {a}
        {b}
        {c}
      </Session>,
    );

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(1);
    expect(wrapper.find('.c')).toHaveLength(0);
  });

  it('prevents initial index from being greater than elements length', () => {
    const a = <i className="a" />;
    const b = <i className="b" />;
    const wrapper = shallow(
      <Session initialIndex={22}>
        {a}
        {b}
      </Session>,
    );

    expect(
      (wrapper.find('.b').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);
  });
});

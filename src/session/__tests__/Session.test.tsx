import * as React from 'react';
import { shallow } from 'enzyme';
import Session, { CLUISession } from '../Session';

describe('Session', () => {
  it('renders child', () => {
    const a = <i className="a" />;
    const wrapper = shallow(<Session>{a}</Session>);

    expect(wrapper.find('.a').length).toEqual(1);
  });

  it('renders child at index 0', () => {
    const a = <i className="a" />;
    const b = <i className="b" />;
    const wrapper = shallow(
      <Session>
        {a}
        {b}
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
  });

  it('renders child at initial index', () => {
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

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(1);
    expect(wrapper.find('.c').length).toEqual(0);
  });

  it('prevents initial index from being greater than node length', () => {
    const a = <i className="a" />;
    const b = <i className="b" />;
    const wrapper = shallow(
      <Session initialIndex={22}>
        {a}
        {b}
      </Session>,
    );

    expect(
      (wrapper.find('.b').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);
  });
});

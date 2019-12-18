import * as React from 'react';
import { mount } from 'enzyme';
import Session, { ISessionItem } from '../Session';
import { act } from 'react-dom/test-utils';

describe('session.reset()', () => {
  it('resets to first item after next is called', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
      </Session>,
    );

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).next();
    });
    wrapper.update();
    expect(wrapper.find('.b').length).toEqual(1);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).session.reset();
    });
    wrapper.update();

    const item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(wrapper.find('.b').length).toEqual(0);
    expect(item.session.currentIndex).toEqual(0);
  });

  it('resets to first item after inserting element', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem)
        .insertAfter(<i className="b" />)
        .next();
    });
    wrapper.update();
    expect(wrapper.find('.b').length).toEqual(1);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).session.reset();
    });
    wrapper.update();

    const item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(wrapper.find('.b').length).toEqual(0);
    expect(item.session.currentIndex).toEqual(0);
  });
});

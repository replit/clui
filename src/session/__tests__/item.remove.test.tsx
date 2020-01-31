import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('item.remove()', () => {
  it('removes element', () => {
    const wrapper = mount(
      <Session initialIndex={1}>
        <i className="a" />
        <i className="b" />
      </Session>,
    );
    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(1);
    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);

    act(() => {
      (wrapper.find('.b').prop('item') as ISessionItem).remove();
    });
    wrapper.update();

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);
    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(0);
  });
});

import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('session.insertAfter(<element>)', () => {
  it('inserts <element> after item', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    let el = wrapper.find('.a');
    let item = el.prop('item') as ISessionItem;

    expect(el).toHaveLength(1);
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      item.insertAfter(<i className="b" />);
    });
    wrapper.update();

    el = wrapper.find('.a');
    item = el.prop('item') as ISessionItem;
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(2);
  });

  it('inserts <element> after item and advances if next() is called', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
      </Session>,
    );

    let el = wrapper.find('.a');
    let item = el.prop('item') as ISessionItem;

    expect(el).toHaveLength(1);
    expect(item.session.currentIndex).toEqual(0);
    expect(item.session).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      item.insertAfter(<i className="b" />);
      item.next();
    });
    wrapper.update();

    el = wrapper.find('.a');
    item = el.prop('item') as ISessionItem;
    expect(item.session.currentIndex).toEqual(1);
    expect(item.session).toHaveLength(2);
    expect(wrapper.find('.b')).toHaveLength(1);
  });

  it('inserts <element> after non-active item and advances currentIndex', () => {
    const wrapper = mount(
      <Session initialIndex={1}>
        <i className="a" />
        <i className="c" />
      </Session>,
    );

    let item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(item.session.currentIndex).toEqual(1);
    expect(item.session).toHaveLength(2);

    act(() => {
      item.insertAfter(<i className="b" />);
    });
    wrapper.update();
    item = wrapper.find('.a').prop('item') as ISessionItem;

    expect(item.session).toHaveLength(3);
    expect(item.session.currentIndex).toEqual(2);
    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(1);
    expect(wrapper.find('.c')).toHaveLength(1);
  });
});

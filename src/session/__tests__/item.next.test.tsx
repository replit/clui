import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('item.next()', () => {
  it('shows next element', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    let currentStep = wrapper.find('.a');
    expect(currentStep).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);
    expect(wrapper.find('.c')).toHaveLength(0);

    act(() => {
      (currentStep.prop('item') as ISessionItem).next();
    });
    wrapper.update();
    currentStep = wrapper.find('.b');

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(currentStep).toHaveLength(1);
    expect(wrapper.find('.c')).toHaveLength(0);

    act(() => {
      (currentStep.prop('item') as ISessionItem).next();
    });
    wrapper.update();

    expect(wrapper.find('.c')).toHaveLength(1);
  });

  it('keeps index less than or equal to total length', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
      </Session>,
    );

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(0);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).next();
    });
    wrapper.update();

    expect(
      (wrapper.find('.b').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);

    act(() => {
      (wrapper.find('.b').prop('item') as ISessionItem).next();
    });
    wrapper.update();

    expect(
      (wrapper.find('.b').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);
  });

  it('calls onDone when at last child', () => {
    const onDone = jest.fn();
    mount(
      <Session onDone={onDone}>
        <i className="a" />
      </Session>,
    );

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('calls next if nested within another <Session>', () => {
    const wrapper = mount(
      <Session>
        <em className="a" />
        <Session>
          <b className="b" />
        </Session>
      </Session>,
    );

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).next();
    });
    wrapper.update();

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(wrapper.find('.b')).toHaveLength(1);
  });

  it('does not advance when called next multiple times from same element', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    expect(wrapper.find('.a')).toHaveLength(1);
    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(0);
    expect(wrapper.find('.b')).toHaveLength(0);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).next();
    });
    wrapper.update();
    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).next();
    });
    wrapper.update();
    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.currentIndex,
    ).toEqual(1);
  });

  it('does not change currentIndex if next is called on non-active item', () => {
    const wrapper = mount(
      <Session initialIndex={1}>
        <i className="a" />
        <i className="c" />
      </Session>,
    );

    let item = wrapper.find('.a').prop('item') as ISessionItem;
    expect(wrapper.find('.c')).toHaveLength(1);
    expect(item.session).toHaveLength(2);
    expect(item.session.currentIndex).toEqual(1);

    act(() => {
      item.insertAfter(<i className="b" />).next();
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

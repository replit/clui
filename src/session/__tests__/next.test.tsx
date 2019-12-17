import * as React from 'react';
import { mount } from 'enzyme';
import Session, { CLUISession } from '../Session';
import { act } from 'react-dom/test-utils';
import { expectIndex } from '../../testUtil';

describe('session.next()', () => {
  it('shows next node', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    let currentStep = wrapper.find('.a');
    expect(currentStep.length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
    expect(wrapper.find('.c').length).toEqual(0);

    // @ts-ignore
    act(() => currentStep.prop('session').next());
    wrapper.update();
    currentStep = wrapper.find('.b');

    expect(wrapper.find('.a').length).toEqual(1);
    expect(currentStep.length).toEqual(1);
    expect(wrapper.find('.c').length).toEqual(0);

    // @ts-ignore
    act(() => currentStep.prop('session').next());
    wrapper.update();

    expect(wrapper.find('.c').length).toEqual(1);
  });

  it('keeps currentIndex less than or equal to total length', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
      </Session>,
    );

    expectIndex(wrapper, 0)('a');

    // @ts-ignore
    act(() => (wrapper.find('.a').prop('session') as CLUISession).next());
    wrapper.update();

    expectIndex(wrapper, 1)('b');

    // @ts-ignore
    act(() => (wrapper.find('.b').prop('session') as CLUISession).next());
    wrapper.update();

    expectIndex(wrapper, 1)('b');
  });

  it('calls onDone when at last child', () => {
    const onDone = jest.fn();
    const wrapper = mount(
      <Session onDone={onDone}>
        <i className="a" />
      </Session>,
    );

    expect(onDone).toHaveBeenCalledTimes(0);

    // @ts-ignore
    act(() => (wrapper.find('.a').prop('session') as CLUISession).next());
    wrapper.update();

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('calls next if nested within another <Session>', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <Session>
          <i className="b" />
        </Session>
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);

    // @ts-ignore
    act(() => (wrapper.find('.a').prop('session') as CLUISession).next());
    wrapper.update();

    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(1);
  });

  it('does not advance when callind next multiple times from same element', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    expect(wrapper.find('.a').length).toEqual(1);
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(0);
    expect(wrapper.find('.b').length).toEqual(0);

    // @ts-ignore
    act(() => (wrapper.find('.a').prop('session') as CLUISession).next());
    wrapper.update();
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);

    act(() => (wrapper.find('.a').prop('session') as CLUISession).next());
    wrapper.update();
    expect(
      (wrapper.find('.a').prop('session') as CLUISession).currentIndex,
    ).toEqual(1);
  });
});

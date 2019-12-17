import * as React from 'react';
import { mount } from 'enzyme';
import Session from '../index';
import { act } from 'react-dom/test-utils';
import { expectIndex } from '../../testUtil';

describe('session.reset()', () => {
  it('resets session', () => {
    const wrapper = mount(
      <Session>
        <div className="a">a</div>
        <div className="b">b</div>
      </Session>,
    );

    let currentStep = wrapper.find('.a');
    expectIndex(wrapper, 0);
    expect(currentStep.length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);

    // @ts-ignore
    act(() => currentStep.prop('session').next());
    wrapper.update();
    expectIndex(wrapper, 1);
    currentStep = wrapper.find('.b');

    expect(wrapper.find('.a').length).toEqual(1);
    expect(currentStep.length).toEqual(1);

    // @ts-ignore
    act(() => currentStep.prop('session').reset());
    wrapper.update();

    expectIndex(wrapper, 0);
    expect(wrapper.find('.a').length).toEqual(1);
    expect(wrapper.find('.b').length).toEqual(0);
  });
});

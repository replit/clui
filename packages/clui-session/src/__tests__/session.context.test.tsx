import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Session, { ISessionItem } from '../Session';

describe('item.context', () => {
  it('passes through value', () => {
    const context = 'wat';
    const wrapper = mount(
      <Session context={context}>
        <i className="a" />
      </Session>,
    );

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.context,
    ).toEqual(context);
  });

  it('passes through object', () => {
    const context = { wat: 'wat' };
    const wrapper = mount(
      <Session context={context}>
        <i className="a" />
      </Session>,
    );

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.context,
    ).toEqual(context);
  });

  it('passes through updated values', () => {
    const Wrap = () => {
      const [val, setVal] = React.useState(1);

      return (
        <Session context={{ val, setVal }}>
          <i className="a" />
        </Session>
      );
    };

    const wrapper = mount(<Wrap />);

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.context.val,
    ).toEqual(1);

    act(() => {
      (wrapper.find('.a').prop('item') as ISessionItem).session.context.setVal(
        2,
      );
    });

    wrapper.update();

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.context.val,
    ).toEqual(2);
  });
});

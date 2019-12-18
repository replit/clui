import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Session, { ISessionItem } from '../Session';
import { act } from 'react-dom/test-utils';

const testLenghtBeforeAndAfterUpdate = (
  wrapper: ReactWrapper,
  item: ISessionItem,
  expected: number,
) => {
  expect(item.session.length).toEqual(expected);
  // Value should be the same after rendering
  wrapper.update();
  expect(item.session.length).toEqual(expected);
};

describe('session.length', () => {
  it('sets the length', () => {
    const wrapper = mount(
      <Session>
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </Session>,
    );

    expect(
      (wrapper.find('.a').prop('item') as ISessionItem).session.length,
    ).toEqual(3);
  });

  describe('item.insertAfter()', () => {
    it('updates length after inserting element', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      let item = wrapper.find('.a').prop('item') as ISessionItem;

      expect(item.session.length).toEqual(1);
      act(() => {
        item.insertAfter(<i className="b" />);
      });

      testLenghtBeforeAndAfterUpdate(wrapper, item, 2);
    });

    it('updates length after inserting many element', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      let item = wrapper.find('.a').prop('item') as ISessionItem;

      expect(item.session.length).toEqual(1);
      act(() => {
        item.insertAfter(
          <i className="b" />,
          <i className="c" />,
          <i className="d" />,
        );
      });

      testLenghtBeforeAndAfterUpdate(wrapper, item, 4);
    });
  });

  describe('item.insertBefore()', () => {
    it('updates after inserting', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      let item = wrapper.find('.a').prop('item') as ISessionItem;

      expect(item.session.length).toEqual(1);
      act(() => {
        item.insertBefore(<i className="b" />);
      });

      testLenghtBeforeAndAfterUpdate(wrapper, item, 2);
    });

    it('updates after inserting multiple', () => {
      const wrapper = mount(
        <Session>
          <i className="a" />
        </Session>,
      );

      let item = wrapper.find('.a').prop('item') as ISessionItem;

      expect(item.session.length).toEqual(1);
      act(() => {
        item.insertAfter(
          <i className="b" />,
          <i className="c" />,
          <i className="d" />,
        );
      });

      testLenghtBeforeAndAfterUpdate(wrapper, item, 4);
    });
  });

  describe('item.remove()', () => {
    it('updates after removing', () => {
      const wrapper = mount(
        <Session initialIndex={1}>
          <i className="a" />
          <i className="b" />
        </Session>,
      );

      let item = wrapper.find('.b').prop('item') as ISessionItem;

      expect(item.session.length).toEqual(2);
      act(() => {
        item.remove();
      });

      testLenghtBeforeAndAfterUpdate(wrapper, item, 1);
    });
  });
});

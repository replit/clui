import * as React from "react";
import { shallow, ShallowWrapper, mount, ReactWrapper, render } from "enzyme";
import Session, { CLUISessionItem } from "../Session";
import { act } from "react-dom/test-utils";

describe("Session", () => {
  it("renders child", () => {
    const a = <div className="a" />;
    const wrapper = shallow(<Session>{a}</Session>);

    expect(wrapper.find(".a").length).toEqual(1);
  });

  it("renders child at index 0", () => {
    const a = <div className="a" />;
    const b = <div className="b" />;
    const wrapper = shallow(
      <Session>
        {a}
        {b}
      </Session>
    );

    expect(wrapper.find(".a").length).toEqual(1);
    expect(wrapper.find(".b").length).toEqual(0);
  });

  it("renders child at initial index", () => {
    const a = <div className="a" />;
    const b = <div className="b" />;
    const c = <div className="c" />;
    const wrapper = shallow(
      <Session initialIndex={1}>
        {a}
        {b}
        {c}
      </Session>
    );

    expect(wrapper.find(".a").length).toEqual(1);
    expect(wrapper.find(".b").length).toEqual(1);
    expect(wrapper.find(".c").length).toEqual(0);
  });

  describe("next()", () => {
    const testClass = (
      wrapper: ReactWrapper | ShallowWrapper,
      className: string,
      flag: boolean
    ) => {
      const len = wrapper.find("." + className).length;
      expect(len).toEqual(flag ? 1 : 0);
    };

    it.only("shows next node", () => {
      const Next: React.FC<React.HTMLProps<HTMLButtonElement> &
        CLUISessionItem> = props => {
        return (
          <button
            className={props.className}
            onClick={() => {
              props.session.next();
            }}
          >
            {props.children}
          </button>
        );
      };

      const wrapper = mount(
        <Session>
          <Next className="a">a</Next>
          <Next className="b">b</Next>
          <Next className="c">c</Next>
        </Session>
      );

      let currentStep = wrapper
        .childAt(0)
        .children()
        .find(".a");
      expect(currentStep.length).toEqual(1);

      expect(
        wrapper
          .childAt(1)
          .children()
          .find(".b").length
      ).toEqual(0);

      expect(
        wrapper
          .childAt(2)
          .children()
          .find(".c").length
      ).toEqual(0);

      // @ts-ignore
      act(() => currentStep.prop("onClick")());
      wrapper.update();

      currentStep = wrapper
        .childAt(1)
        .children()
        .find(".b");

      expect(
        wrapper
          .childAt(0)
          .children()
          .find(".a").length
      ).toEqual(1);

      expect(currentStep.length).toEqual(1);

      expect(
        wrapper
          .childAt(2)
          .children()
          .find(".c").length
      ).toEqual(0);

      // @ts-ignore
      act(() => currentStep.prop("onClick")());
      wrapper.update();

      expect(
        wrapper
          .childAt(2)
          .children()
          .find(".c").length
      ).toEqual(1);
    });
  });
});

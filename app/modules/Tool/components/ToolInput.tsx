import type { Dispatch, FormEvent, InputHTMLAttributes, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { Form } from "@heroui/react";

export default function ToolInput({
  value,
  setValue,
  onEnter,
  className,
  changeOnWheel,
  ...props
}: {
  value: string;
  setValue: Dispatch<SetStateAction<string>> | ((value: string) => void);
  className?: string;
  changeOnWheel?: boolean;
  onEnter?: (evt: FormEvent<HTMLFormElement>) => void;
} & InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onInternalStep = (up: boolean) => {
    // userTypingRef.current = false;

    let stepDecimal = 1;
    if (!up) {
      stepDecimal = -stepDecimal;
    }

    const target = parseInt(value) + stepDecimal;

    setValue(target.toString());
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (changeOnWheel) {
      const onWheel = (event: WheelEvent) => {
        // moving mouse wheel rises wheel event with deltaY < 0
        // scroll value grows from top to bottom, as screen Y coordinate
        onInternalStep(event.deltaY < 0);
        event.preventDefault();
      };
      const input = inputRef.current;
      if (input) {
        // React onWheel is passive and we can't preventDefault() in it.
        // That's why we should subscribe with DOM listener
        // https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
        input.addEventListener("wheel", onWheel, { passive: false });
        return () => input.removeEventListener("wheel", onWheel);
      }
    }
  });

  return (
    <Form onSubmit={onEnter}>
      <input
        ref={inputRef}
        aria-label="char"
        value={value}
        onChange={(evt) => setValue(evt.target.value)}
        className={"px-3 w-full text-[1rem] h-12 bg-black-gray outline-none " + (className ? className : "")}
        {...props}
      />
    </Form>
  );
}

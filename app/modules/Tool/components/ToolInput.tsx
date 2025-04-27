import type {
  Dispatch,
  FormEvent,
  InputHTMLAttributes,
  SetStateAction,
} from "react";
import { Form } from "@heroui/react";

export default function ToolInput({
  value,
  setValue,
  onEnter,
  className,
  ...props
}: {
  value: string;
  setValue: Dispatch<SetStateAction<string>> | ((value: string) => void);
  className?: string;
  onEnter?: (evt: FormEvent<HTMLFormElement>) => void;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Form onSubmit={onEnter}>
      <input
        aria-label="char"
        value={value}
        onChange={(evt) => setValue(evt.target.value)}
        className={
          "px-3 w-full text-[1rem] h-12 bg-black-gray outline-none " +
          (className ? className : "")
        }
        {...props}
      />
    </Form>
  );
}

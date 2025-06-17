import { Button, type ButtonProps } from "@heroui/react";

export default function ToolButton({ children, className, ...props }: { children: React.ReactNode } & ButtonProps) {
  return (
    <Button
      radius="none"
      className={"bg-black-gray w-full h-12 data-[focus-visible=true]:!outline-none " + className}
      {...props}
    >
      {children}
    </Button>
  );
}

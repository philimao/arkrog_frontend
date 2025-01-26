import {
  Button,
  Checkbox,
  Link,
  ModalFooter,
  useDisclosure,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Input,
  Form,
} from "@heroui/react";
import React, { type FormEvent } from "react";
import { login } from "~/utils/user";
import { toast } from "react-toastify";
import { useUserStore } from "~/stores/store";

interface LoginModalProps {
  id?: string;
}

export default function LoginModal({ id = "login" }: LoginModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const updateUsername = useUserStore((state) => state.updateUsername);
  const updateSettings = useUserStore((state) => state.updateSettings);

  async function handleSubmit(
    evt: FormEvent<HTMLFormElement>,
    onClose: () => void,
  ) {
    evt.preventDefault();
    const data = Object.fromEntries(
      new FormData(evt.currentTarget as HTMLFormElement),
    );
    const loginResult = await login(
      data.username as string,
      data.password as string,
    );
    if (loginResult) {
      const { username, settings } = loginResult;
      updateUsername(username);
      updateSettings(settings);
      toast.info("登录成功！");
      onClose();
    } else {
      toast.error("登录失败！");
    }
  }

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        id={id}
        className="bg-ak-blue text-black rounded-none font-bold"
      >
        登录
      </Button>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                用户登录
              </ModalHeader>
              <ModalBody>
                <Form
                  className="w-full max-w-xs flex flex-col gap-4"
                  validationBehavior="native"
                  onSubmit={(evt) => handleSubmit(evt, onClose)}
                >
                  <Input
                    endContent={
                      <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                    }
                    name="username"
                    autoComplete="on"
                    label="用户名"
                    placeholder="请输入用户名"
                    variant="bordered"
                  />
                  <Input
                    endContent={
                      <LockIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                    }
                    name="password"
                    autoComplete="on"
                    label="密码"
                    placeholder="请输入密码"
                    type="password"
                    variant="bordered"
                  />
                  <div className="flex py-2 px-1 justify-between">
                    <Link color="primary" href="#" size="sm">
                      忘记密码？
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="hidden"
                    id={id + "_submit"}
                  />
                </Form>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  关闭
                </Button>
                <Button
                  color="primary"
                  onPress={() =>
                    document.getElementById(id + "_submit")?.click()
                  }
                >
                  登录
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export const MailIcon = (props: React.ComponentProps<any>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M17 3.5H7C4 3.5 2 5 2 8.5V15.5C2 19 4 20.5 7 20.5H17C20 20.5 22 19 22 15.5V8.5C22 5 20 3.5 17 3.5ZM17.47 9.59L14.34 12.09C13.68 12.62 12.84 12.88 12 12.88C11.16 12.88 10.31 12.62 9.66 12.09L6.53 9.59C6.21 9.33 6.16 8.85 6.41 8.53C6.67 8.21 7.14 8.15 7.46 8.41L10.59 10.91C11.35 11.52 12.64 11.52 13.4 10.91L16.53 8.41C16.85 8.15 17.33 8.2 17.58 8.53C17.84 8.85 17.79 9.33 17.47 9.59Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LockIcon = (props: React.ComponentProps<any>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M12.0011 17.3498C12.9013 17.3498 13.6311 16.6201 13.6311 15.7198C13.6311 14.8196 12.9013 14.0898 12.0011 14.0898C11.1009 14.0898 10.3711 14.8196 10.3711 15.7198C10.3711 16.6201 11.1009 17.3498 12.0011 17.3498Z"
        fill="currentColor"
      />
      <path
        d="M18.28 9.53V8.28C18.28 5.58 17.63 2 12 2C6.37 2 5.72 5.58 5.72 8.28V9.53C2.92 9.88 2 11.3 2 14.79V16.65C2 20.75 3.25 22 7.35 22H16.65C20.75 22 22 20.75 22 16.65V14.79C22 11.3 21.08 9.88 18.28 9.53ZM12 18.74C10.33 18.74 8.98 17.38 8.98 15.72C8.98 14.05 10.34 12.7 12 12.7C13.66 12.7 15.02 14.06 15.02 15.72C15.02 17.39 13.67 18.74 12 18.74ZM7.35 9.44C7.27 9.44 7.2 9.44 7.12 9.44V8.28C7.12 5.35 7.95 3.4 12 3.4C16.05 3.4 16.88 5.35 16.88 8.28V9.45C16.8 9.45 16.73 9.45 16.65 9.45H7.35V9.44Z"
        fill="currentColor"
      />
    </svg>
  );
};

import {
  Button,
  useDisclosure,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Input,
  Form,
} from "@heroui/react";
import React, { type FormEvent } from "react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { SVGIcon } from "~/components/SVGIcon/SVGIcon";
import { ModalFooter } from "@heroui/modal";
import { StyledModalContent } from "~/modules/TopNav/styled";

interface LoginModalProps {
  id?: string;
  [key: string]: any;
}

export default function LoginModal({
  id = "login",
  ...props
}: LoginModalProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const { login } = useUserInfoStore();
  const { isLoginOpen, onLoginOpen, onLoginClose, onRegisterOpen } = props;

  async function handleSubmit(
    evt: FormEvent<HTMLFormElement>,
    onClose: () => void,
  ) {
    evt.preventDefault();
    const data = Object.fromEntries(
      new FormData(evt.currentTarget as HTMLFormElement),
    );
    (await login(data.username as string, data.password as string)) &&
      onClose();
  }

  function switchToRegister() {
    onLoginClose();
    onRegisterOpen();
  }

  return (
    <>
      <Button
        color="primary"
        onPress={onLoginOpen as () => void}
        id={id}
        className="bg-ak-blue text-black rounded-none font-bold w-20"
      >
        登录
      </Button>
      <Modal
        isOpen={isLoginOpen as boolean}
        onClose={onLoginClose}
        placement="top-center"
        radius="none"
        classNames={{
          base: "w-[24rem]",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
        backdrop="blur"
        closeButton={
          <button style={{ zIndex: 1000 }}>
            <SVGIcon name="modal-close" width="0.7rem" height="0.7rem" />
          </button>
        }
      >
        <ModalContent>
          <StyledModalContent>
            <ModalHeader className="text-white block">
              <div className="flex mb-2">
                <span className="text-2xl me-3">登录</span>
                <span className="text-md self-end opacity-60">
                  解锁更多功能
                </span>
              </div>
              <div className="font-light text-xs">
                <span>新用户？</span>
                <span
                  className="text-ak-blue text-xs"
                  role="button"
                  onClick={switchToRegister}
                >
                  创建账户
                </span>
              </div>
            </ModalHeader>
            <ModalBody>
              <Form
                className="w-full flex flex-col gap-4"
                validationBehavior="native"
                onSubmit={(evt) => handleSubmit(evt, onLoginClose)}
              >
                <Input
                  name="username"
                  autoComplete="username"
                  placeholder="用户名/邮箱"
                  variant="flat"
                  radius="none"
                  classNames={{
                    inputWrapper: "bg-black-gray h-12",
                  }}
                />
                <Input
                  endContent={
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                    >
                      {isVisible ? (
                        <SVGIcon
                          name="eye-open"
                          width="1.5rem"
                          height="1.5rem"
                          className="pointer-events-none"
                        />
                      ) : (
                        <SVGIcon
                          name="eye-closed"
                          width="1.5rem"
                          height="1.5rem"
                          className="pointer-events-none"
                        />
                      )}
                    </button>
                  }
                  name="password"
                  placeholder="密码"
                  autoComplete="password"
                  type={isVisible ? "text" : "password"}
                  variant="flat"
                  radius="none"
                  classNames={{
                    inputWrapper: "bg-black-gray h-12",
                  }}
                />
                <span
                  className="text-light-gray text-xs self-end -translate-y-1.5"
                  role="button"
                >
                  忘记密码？
                </span>
                <Button
                  type="submit"
                  className="w-full bg-ak-deep-blue font-medium text-base"
                  radius="none"
                >
                  登&nbsp;&nbsp;&nbsp;录
                </Button>
              </Form>
            </ModalBody>
            <ModalFooter />
          </StyledModalContent>
        </ModalContent>
      </Modal>
    </>
  );
}

import {
  Button,
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
import { toast } from "react-toastify";

interface RegisterModalProps {
  id?: string;
  isRegisterOpen: boolean;
  onRegisterClose: () => void;
  onLoginOpen: () => void;
}

export default function RegisterModal({ ...props }: RegisterModalProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isVisible, setIsVisible] = React.useState(false);
  const [isVisible2, setIsVisible2] = React.useState(false);
  const { register } = useUserInfoStore();
  const { onLoginOpen, isRegisterOpen, onRegisterClose } = props;

  const validateEmail = (value: string) =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
  const isEmailInvalid = React.useMemo(() => {
    if (email === "") return false;
    return !validateEmail(email);
  }, [email]);
  const isConfirmPasswordValid = React.useMemo(() => {
    if (confirmPassword === "") return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);

  async function handleSubmit(
    evt: FormEvent<HTMLFormElement>,
    onClose: () => void,
  ) {
    evt.preventDefault();
    const data = Object.fromEntries(
      new FormData(evt.currentTarget as HTMLFormElement),
    );

    if (confirmPassword !== password) {
      return toast.warning("两次输入的密码不一致！");
    }
    delete data.confirmPassword;

    if (await register(data.email as string, data.password as string)) {
      onClose();
    }
  }

  function handleClose() {
    setIsVisible(false); // Reset isVisible to false when step away from RegisterModal
    onRegisterClose();
  }

  function switchToLogin() {
    handleClose();
    onLoginOpen();
  }

  return (
    <>
      <Modal
        isOpen={isRegisterOpen}
        placement="top-center"
        radius="none"
        classNames={{
          base: "my-auto w-[24rem]",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
        backdrop="blur"
        closeButton={
          <button style={{ zIndex: 1000 }}>
            <SVGIcon name="modal-close" width="0.7rem" height="0.7rem" />
          </button>
        }
        onClose={handleClose}
      >
        <ModalContent>
          {(onClose) => (
            <StyledModalContent>
              <ModalHeader className="text-white block">
                <div className="flex mb-2">
                  <span className="text-2xl me-3">注册</span>
                  <span className="text-md self-end opacity-60">
                    欢迎来到？？？？
                  </span>
                </div>
                <div className="font-light text-xs">
                  <span>已有账户？</span>
                  <span
                    className="text-ak-blue text-xs"
                    role="button"
                    onClick={switchToLogin}
                  >
                    直接登录
                  </span>
                </div>
              </ModalHeader>
              <ModalBody>
                <Form
                  className="w-full flex flex-col gap-4"
                  validationBehavior="native"
                  onSubmit={(evt) => handleSubmit(evt, onClose)}
                >
                  <Input
                    name="email"
                    autoComplete="email"
                    placeholder="邮箱"
                    variant="flat"
                    radius="none"
                    classNames={{
                      inputWrapper: "bg-black-gray h-12",
                    }}
                    value={email}
                    onValueChange={setEmail}
                    isInvalid={isEmailInvalid}
                    errorMessage="请输入合法的邮箱地址！"
                  />
                  <Input
                    endContent={
                      <button
                        tabIndex={-1}
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
                    value={password}
                    onValueChange={setPassword}
                  />
                  <Input
                    endContent={
                      <button
                        tabIndex={-1}
                        aria-label="toggle password visibility"
                        className="focus:outline-none"
                        type="button"
                        onClick={() => setIsVisible2(!isVisible2)}
                      >
                        {isVisible2 ? (
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
                    name="confirmPassword"
                    placeholder="确认密码"
                    autoComplete="password"
                    type={isVisible2 ? "text" : "password"}
                    variant="flat"
                    radius="none"
                    classNames={{
                      inputWrapper: "bg-black-gray h-12",
                    }}
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    isInvalid={isConfirmPasswordValid}
                    errorMessage="两次输入的密码不一致！"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-ak-deep-blue font-medium text-base mt-4"
                    radius="none"
                  >
                    注&nbsp;&nbsp;&nbsp;册
                  </Button>
                </Form>
              </ModalBody>
              <ModalFooter />
            </StyledModalContent>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

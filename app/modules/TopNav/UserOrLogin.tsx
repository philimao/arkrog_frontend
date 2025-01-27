import { useDisclosure } from "@heroui/react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import LoginModal from "~/modules/TopNav/LoginModal";
import UserAvatar from "~/modules/TopNav/UserAvatar";
import RegisterModal from "~/modules/TopNav/RegisterModal";

export default function UserOrLogin() {
  const { userInfo } = useUserInfoStore();

  // 用于将两个Modal变量提升
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();
  const {
    isOpen: isRegisterOpen,
    onOpen: onRegisterOpen,
    onClose: onRegisterClose,
  } = useDisclosure();
  const props = {
    isLoginOpen,
    onLoginOpen,
    onLoginClose,
    isRegisterOpen,
    onRegisterOpen,
    onRegisterClose,
  };

  return (
    <>
      {userInfo?.username ? (
        <UserAvatar />
      ) : (
        <>
          <LoginModal id="login" {...props} />
          <RegisterModal id="register" {...props} />
        </>
      )}
    </>
  );
}

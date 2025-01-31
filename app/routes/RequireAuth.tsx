import { useNavigate } from "react-router";
import { useUserInfoStore } from "~/stores/userInfoStore";
import React, { useEffect } from "react";

function RedirectComp() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/");
  }, []);
  return null;
}

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userInfo, loaded } = useUserInfoStore();
  if (!loaded) return null;
  if (!userInfo?.username) return <RedirectComp />;
  else return <>{children}</>;
}

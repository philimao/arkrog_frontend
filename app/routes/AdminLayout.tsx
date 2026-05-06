import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { adminPages } from "~/routes";
import RequireAuth from "~/routes/RequireAuth";
import SidebarLayout from "~/components/SidebarLayout";
import { useUserInfoStore } from "~/stores/userInfoStore";

const ADMIN_MIN_LEVEL = 4;

function LevelGuard({ children }: { children: ReactNode }) {
  const { userInfo, loaded } = useUserInfoStore();
  const navigate = useNavigate();
  const level = userInfo?.level ?? 0;
  useEffect(() => {
    if (loaded && level < ADMIN_MIN_LEVEL) {
      navigate("/", { replace: true });
    }
  }, [loaded, level, navigate]);
  if (!loaded || level < ADMIN_MIN_LEVEL) return null;
  return <>{children}</>;
}

export default function AdminLayout() {
  return (
    <SidebarLayout
      basePath="/admin"
      pages={adminPages}
      wrap={(c) => (
        <RequireAuth>
          <LevelGuard>{c}</LevelGuard>
        </RequireAuth>
      )}
    />
  );
}

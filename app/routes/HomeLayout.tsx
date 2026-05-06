import { homePages } from "~/routes";
import RequireAuth from "~/routes/RequireAuth";
import SidebarLayout from "~/components/SidebarLayout";

export default function HomeLayout() {
  return (
    <SidebarLayout
      basePath="/home"
      pages={homePages}
      wrap={(c) => <RequireAuth>{c}</RequireAuth>}
    />
  );
}

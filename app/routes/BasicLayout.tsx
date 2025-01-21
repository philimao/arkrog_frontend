import MyNavbar from "~/modules/TopNav/TopNavbar";
import { Outlet } from "react-router";

export default function () {
  return (
    <>
      <MyNavbar />
      <Outlet />
    </>
  );
}

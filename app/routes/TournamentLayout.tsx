import { Outlet } from "react-router";

export default function TournamentsLayout() {
  return (
    <div className="container grow">
      <Outlet />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useRelicFreeStore } from "~/stores/relicFreeStore";

export default function RelicFreeLayout() {
  const { fetchRelicFreeData } = useRelicFreeStore();
  const { fetchGameDataBasic } = useGameDataStore();
  const [loaded, setLoaded] = useState(false);

  // 从其他页面切换至无藏页面时
  useEffect(() => {
    Promise.all([fetchGameDataBasic(), fetchRelicFreeData()]).then(() => setLoaded(true));
  }, [fetchGameDataBasic, fetchRelicFreeData]);

  if (!loaded) return <Loading />;
  return (
    <div className="container grow">
      <Outlet />
    </div>
  );
}

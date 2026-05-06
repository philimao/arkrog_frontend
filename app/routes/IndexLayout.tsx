import React, { useEffect } from "react";
import MyToolbox from "~/modules/IndexPage/Toolbox/MyToolbox";
import IndexRelicFree from "~/modules/IndexPage/IndexRelicFree";
import Banner from "~/modules/IndexPage/Banner";
import IndexBlog from "~/modules/IndexPage/IndexBlog";
import { useAppDataStore } from "~/stores/appDataStore";
import Loading from "~/components/Loading";

export default function IndexLayout() {
  const { appDataLoaded, fetchAppData } = useAppDataStore();

  // 从其他页面切换至主页时，加载主页应用数据
  useEffect(() => {
    if (!appDataLoaded) fetchAppData();
  }, [appDataLoaded, fetchAppData]);

  if (!appDataLoaded) return <Loading />;
  return (
    <div className="container max-w-xl md:px-10 lg:px-16 xl:px-20 mx-auto">
      <Banner />
      <MyToolbox />
      <IndexRelicFree />
      <IndexBlog />
    </div>
  );
}

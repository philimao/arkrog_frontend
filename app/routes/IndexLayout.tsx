import React from "react";
import MyToolbox from "~/modules/Index/Toolbox/MyToolbox";
import IndexRelicFree from "~/modules/Index/IndexRelicFree/IndexRelicFree";
import Banner from "~/modules/Index/Banner/Banner";
import IndexBlog from "~/modules/Index/IndexBlog/IndexBlog";

export default function IndexLayout() {
  return (
    <div className="container md:px-10 lg:px-16 xl:px-20 mx-auto">
      <Banner />
      <MyToolbox />
      <IndexRelicFree />
      <IndexBlog />
    </div>
  );
}

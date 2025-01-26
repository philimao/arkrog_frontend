import React from "react";
import MyToolbox from "~/modules/Index/Toolbox/MyToolbox";
import IndexRelicFree from "~/modules/Index/IndexRelicFree/IndexRelicFree";
import Banner from "~/modules/Index/Banner/Banner";
import IndexBlog from "~/modules/Index/IndexBlog/IndexBlog";

export default function IndexLayout() {
  return (
    <div className="container px-48 mx-auto">
      <Banner />
      <MyToolbox />
      <IndexRelicFree />
      <IndexBlog />
    </div>
  );
}

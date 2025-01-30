import React from "react";
import MyToolbox from "~/modules/IndexPage/Toolbox/MyToolbox";
import IndexRelicFree from "~/modules/IndexPage/IndexRelicFree";
import Banner from "~/modules/IndexPage/Banner";
import IndexBlog from "~/modules/IndexPage/IndexBlog";

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

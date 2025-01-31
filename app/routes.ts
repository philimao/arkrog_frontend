import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export const pages = [
  { pathname: "/", title: "集出万全", subtitle: "首页" },
  { pathname: "/relic-free", title: "穷集一生", subtitle: "无藏收录" },
  { pathname: "/seed", title: "百种交集", subtitle: "种子分享" },
  { pathname: "/blog", title: "集思广益", subtitle: "攻略博客" },
  { pathname: "/tool", title: "小集器人", subtitle: "伤害计算" },
  { pathname: "/tournament", title: "高手云集", subtitle: "赛事整理" },
];

export const homePages = [
  { pathname: "/message", title: "消息中心" },
  { pathname: "/favorite", title: "我的收藏" },
  { pathname: "/my-record", title: "个人记录" },
  { pathname: "/link-bilibili", title: "账户链接" },
];

export default [
  layout("routes/RootLayout.tsx", [
    index("routes/IndexLayout.tsx"),
    route("/relic-free", "routes/RelicFreeLayout.tsx", [
      index("modules/RelicFree/Selector/index.tsx"),
      route(":stageId", "modules/RelicFree/Stage/index.tsx"),
    ]),
    route("/home", "routes/HomeLayout.tsx", [
      // index("modules/Home/Message/Selector.tsx"),
      route("message", "modules/Home/Message/index.tsx"),
      route("favorite", "modules/Home/Favorite/index.tsx"),
      route("link-bilibili", "modules/Home/Link/index.tsx"),
    ]),
    route("/seed", "routes/SeedLayout.tsx", [index("modules/Seed/index.tsx")]),
    route("*", "modules/Standalone/NotFoundPage.tsx"),
  ]),
] satisfies RouteConfig;

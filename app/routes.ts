import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export const pages = [
  { pathname: "/", title: "集出万全", subtitle: "首页" },
  { pathname: "/relic-free", title: "穷集一生", subtitle: "无藏收录" },
  { pathname: "/blog", title: "集思广益", subtitle: "攻略博客" },
  { pathname: "/tool", title: "小集器人", subtitle: "伤害计算" },
  { pathname: "/tournament", title: "高手云集", subtitle: "赛事整理" },
];

export default [
  layout("routes/RootLayout.tsx", [
    index("routes/IndexLayout.tsx"),
    route("/relic-free", "routes/RelicFreeLayout.tsx", [
      index("modules/RelicFree/StageSelector.tsx"),
      route(":stage-id", "modules/RelicFree/StagePage.tsx"),
    ]),
    // layout("routes/BlogLayout.tsx", [route("/blog", "")]),
    // layout("routes/ToolLayout.tsx", [route("/tool", "")]),
    // layout("routes/TournamentLayout.tsx", [route("/tournament", "")]),
  ]),
] satisfies RouteConfig;

import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export const pages = [
  { pathname: "/", title: "集语成舟", subtitle: "首页" },
  { pathname: "/relic-free", title: "穷集一生", subtitle: "无藏收录" },
  { pathname: "/seed", title: "百种交集", subtitle: "种子分享" },
  { pathname: "/blog", title: "集思广益", subtitle: "攻略博客" },
  { pathname: "/tool/autochess", title: "卫戍协议", subtitle: "何忆卫" },
  { pathname: "/tool", title: "小集器人", subtitle: "伤害计算" },
  { pathname: "/tournament", title: "高手云集", subtitle: "赛事整理" },
];

export const homePages = [
  { pathname: "/message", title: "消息中心" },
  { pathname: "/favorite", title: "我的收藏" },
  // { pathname: "/my-record", title: "个人记录" },
  { pathname: "/link-bilibili", title: "账户链接" },
];

export default [
  layout("routes/RootLayout.tsx", [
    // 主页
    index("routes/IndexLayout.tsx"),
    // 无藏
    route("/relic-free", "routes/RelicFreeLayout.tsx", [
      index("modules/RelicFree/Selector/index.tsx"),
      route(":stageId", "modules/RelicFree/Stage/index.tsx"),
    ]),
    // 赛事
    route("/tournament", "routes/TournamentLayout.tsx", [
      index("modules/Tournament/index.tsx"),
      route("create", "modules/Tournament/TournamentCreate/index.tsx"),
      route(
        "create-group",
        "modules/Tournament/TournamentCreateGroup/index.tsx",
      ),
      route("edit-group", "modules/Tournament/TournamentEditGroup/index.tsx"),
      route(":tournamentId", "modules/Tournament/TournamentDetail/index.tsx"),
      route(
        ":tournamentId/edit",
        "modules/Tournament/TournamentEdit/index.tsx",
      ),
    ]),
    // 工具
    route("/tool", "routes/ToolLayout.tsx", [
      index("modules/Tool/index.tsx"),
      route("autochess", "modules/Tool/Autochess/index.tsx"),
    ]),
    // 种子
    route("/seed", "routes/SeedLayout.tsx", [index("modules/Seed/index.tsx")]),
    // 个人中心
    route("/home", "routes/HomeLayout.tsx", [
      // index("modules/Home/Message/Selector.tsx"),
      route("message", "modules/Home/Message/index.tsx"),
      route("favorite", "modules/Home/Favorite/index.tsx"),
      route("link-bilibili", "modules/Home/Link/index.tsx"),
    ]),
    // 赞助
    route("/sponsor", "modules/Standalone/Sponsorship.tsx"),
    // 404
    route("*", "modules/Standalone/NotFoundPage.tsx"),
  ]),
] satisfies RouteConfig;

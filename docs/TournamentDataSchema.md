# 赛事信息数据约定

- 赛事信息分为两部分，TournamentData以及TournamentPlayer
- 首先需要收集赛事信息整理成零碎的文字稿，交给大模型AI工具去整理成格式化数据
- 随后交给philimao进行选手信息爬取与数据库导入

### TournamentData

```
interface TournamentData {
    name: string;                   // 比赛完整名称，例：仙术杯#6，仙术杯#1 DLC
    avatar: string;                 // 等图片储存方案定下，留空
    rogue: RogueKey;                // rogue_1 | rouge_2 ... 
    edition: string;                // 初始版本 | DLC_1 | DLC_2
    type: "individual" | "team";    // 个人赛 or 团队赛
    startTime: number;              // 起始毫秒时间戳 
    level: string;                  // 最低等级要求，例：N15
    labels: string[];               // 一些标签，目前可以先留空数组
    rule: string;                   // 规则，md格式string，不要太长
    detailRule?: string;            // 详细规则，md格式string，允许图片
    organizerMid: string;           // 组织者b站mid，可留空
    organizerName: string;          // 组织者b站用户名，需完全匹配
    room: string;                   // 直播间，例：[@巴别塔攻略组](https://xxxxx)
    stages: TournamentStage[];      // 见下方
    teams: TournamentTeam[];        // 团队赛需填写，格式见下方
}

interface TournamentStage {
    name: string;                   // 例：初赛
    startTime: number;              // 起始时间，毫秒时间戳
    endTime: number;                // 结束时间，毫米时间戳
}

interface TournamentTeam {
    name: string;                   // 队伍名
    id?: string;                    // 队伍英文名（如有）
    avatar: string;                 // 等图片储存方案定下，留空
    finalRank?: number;             // 最终名次
    note?: string;                  // 备注
    members: string[];              // 选手mid列表
    leader: string;                 // 队长mid
    keyMember: string;              // 抗压位mid
    stages: TournamentTeamStage[];  // 见下方
}

interface TournamentTeamStage {
    name: string;                   // 场次名称，例：初赛
    point?: number;                 // 总分数
    rank?: number;                  // 排名
}
```

#### 样例 个人赛
```
{
    name: "小粽杯#6",
    avatar: "",
    rogue: "rogue_4",
    edition: "DLC_2",
    type: "individual",
    startTime: 1738483200000,
    level: "N18",
    labels: ["粽杜莎之眼", "粽子又看死一个", "……"],
    rule: "这里写比赛规则",
    organizerMid: "61449102",
    organizerName: "言琰阎焱",
    room: `初赛大粽场：[@有毒的粽子](https://live.bilibili.com/540136)
初赛小粽场：[@言琰阎焱](https://live.bilibili.com/7835728)
决赛：[@有毒的粽子](https://live.bilibili.com/540136)`,
    stages: [
      { name: "初赛", startTime: 1738483200000, endTime: 1738915200000 },
      { name: "决赛", startTime: 1739174400000, endTime: 1739260800000 },
    ],
  }
```

#### 样例 团队赛
```
{
    name: "仙术杯#6",
    avatar: "",
    rogue: "rogue_4",
    edition: "DLC_1",
    type: "team",
    startTime: 1738483200000,
    level: "N15",
    labels: ["..."],
    rule: "short ver",
    detailRule: "some looong md string",
    organizerMid: 37804608,
    organizerName: "龙哥哥今天又鸽了",
    room: `[@龙哥哥今天又鸽了](https://live.bilibili.com/4283606)`,
    stages: [
        { name: "初赛", startTime: 1738483200000, endTime: 1738915200000 },
        { name: "决赛", startTime: 1739174400000, endTime: 1739260800000 },
    ],
    teams: [
        {
            name: "紧集授课",
            id: "ET",
            avatar: "",
            finalRank: undefined,
            note: "",
            members: [123, 345, 567, 789],
            leader: 123,
            keyMember: 789,
            stages: [
                { name: "初赛", point: 100, rank: 8 }
            ]
        }
    ]
}
```

### TournamentPlayer

```
type TournamentPlayer = {
    id: string;                   // 赛事id，与上方相同
    mid: string;                  // 留空即可
    name: string;                 // 选手的B站用户名，需要完全匹配
    face: string;                 // 留空
    teamName?: string;              // 如果是团队赛，需要填写队伍名称
    finalRank?: number;           // 最终排名，如果比赛正在进行中留空
    note?: string;                // 备注
    games: TournamentGame[];      // 见下方 
};

type TournamentGame = {
  stage: string;                  // 该比赛为赛事的哪个阶段，例：初赛
  session?: string;               // 如果比赛分为多个场次需要填写，例：大粽场
  date: number;                   // 参赛日期的毫秒时间戳
  schedule?: string;              // 比赛的第几天，例：Day1
  point?: number;                 // 比分
  ending?: string;                // 结局情况描述，未通关仅可使用“战胜”某关，Boss关用中括号框住，例：通关【魂灵朝谒】/ 战胜【朝谒】，死于【授法】（闪退） / 死于紧急争议频发
  note?: string;                  // 备注，例如：完成短脖兔杯的xx课题
  strategy?: string;              // 需要备注的策略，例如：死仇，美愿，死仇转美愿
  type: "rank" | "1on1";          // 该场次的赛制
  result?: "win" | "lose";        // 是否获胜
  rival?: string;                 // 对手的mid
  starterSquad?: string;          // 开局分队
  starterOp?: string[];           // 开局干员
  level?: string;                 // 本场比赛难度，不填写则继承赛事本身难度
  duration?: string;              // 通关时长（竞速赛可选）
  rank?: number;                  // 本阶段排名
  playback?: string;              // 本场回放
};
```

#### 样例 个人积分赛

```
{
    mid: "13262144",
    name: "伊颜轩",
    face: "https://i0.hdslb.com/bfs/face/91a205618b1ffad2b71f4f8cf35c11219b5851aa.jpg",
    teamName: undefined,
    finalRank: 1,
    note: undefined,
    games: [
        {
            stage: "初赛",
            session: "大粽场",
            date: 1738814400000,
            schedule: "Day4",
            point: 2791.04,
            ending: "通关【紧急授课】【授法】【不容拒绝】",
            note: undefined, 
            type: "rank", 
            result: undefined,
            rivalMid: undefined, 
            starterSquad: "突击战术分队",
            starterOp: undefined, 
            level: undefined, 
            duration: undefined,
            rank: 4,
            playback: "https://bilibili.com/BV123"
        },
        {
            stage: "决赛",
            date: 1739332800000,
            schedule: "Day2",
            point: 3162.46,
            ending: "通关【朝谒】【授法】【不容拒绝】",
            note: undefined,
            type: "rank",
            result: undefined,
            rivalMid: undefined,
            starterSquad: "突击战术分队",
            starterOp: undefined,
            level: undefined,
            duration: undefined,
            rank: 1,
            playback: "https://bilibili.com/BV456"
        },
    ],
}
```

#### 样例 团队积分赛

```
{
    mid: "1231441",
    name: "棋棋Steins",
    face: "https://i0.hdslb.com/bfs/face/91a205618b1ffad2b71f4f8cf35c11219b5851aa.jpg",
    teamName: "紧集授课",
    finalRank: undefined,
    note: undefined,
    games: [
        {
            stage: "初赛",
            date: 1738814400000,
            schedule: "Day6",
            point: 1079,
            ending: "死于朝谒",
            note: undefined, 
            type: "rank", 
            result: undefined,
            rivalMid: undefined, 
            starterSquad: "点刺成锭分队",
            starterOp: undefined, 
            level: undefined, 
            duration: undefined,
            rank: 6,
            playback: "https://bilibili.com/BV123"
        }
    ],
}
```
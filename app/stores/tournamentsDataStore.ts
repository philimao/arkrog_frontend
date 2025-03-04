import { create } from "zustand";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";
import { _get } from "~/utils/tools";

type TournamentsStore = {
  tournamentsData?: TournamentData[];
};

type TournamentDataAction = {
  fetchTournamentsData: () => Promise<void>;
  fetchTournamentPlayer: (tournamentId: string) => Promise<void>;
};

const mockTournamentDataCall = () => {
  return [
    {
      id: "xzb_6",
      name: "小粽杯",
      face: "https",
      season: 6,
      playBack:"https://live.bilibili.com/540136",
      rogue: "rogue_4",
      edition: "DLC2",
      level: "N18",
      labels: ["粽杜莎之眼","粽子又看死一个","……"],
      rule: "这里写比赛规则",
      organizerId: "yyyy",
      organizerName: "言琰阎焱",
      room: "https", // 比较复杂
      stages: [
        { name: "初赛", startTime: 1738483200000, endTime: 1738915200000 },
        { name: "决赛", startTime: 1739174400000, endTime: 1739260800000 },
      ],
    },
    {
      id: "ttls_2",
      name: "通天联赛",
      face: "https",
      season: 2,
      playBack:"https",
      rogue: "rogue_4",
      edition: "DLC2",
      level: "N18",
      labels: ["……"],
      rule: "这里写比赛规则",
      organizerId: "bbt",
      organizerName: "巴别塔攻略组",
      room: "https", // 比较复杂
      stages: [
        { name: "资格赛", startTime: 1740124800000, endTime: 1740729540000 },
      ],
    },
    {
      id: "dbt",
      name: "短脖兔杯",
      face: "https",
      playBack:"https",
      rogue: "rogue_4",
      edition: "初始版本",
      level: "N15",
      labels: ["……"],
      rule: "这里写比赛规则",
      organizerId: "cjl",
      organizerName: "我长颈鹿懂了",
      room: "https", // 比较复杂
      stages: [
        { name: "初赛", startTime: 1726124400000, endTime: 1727074740000 },
        { name: "决赛", startTime: 1727334000000, endTime: 1727765940000 },
      ],
    }
  ]
};

const mockPlayerDataCall = (tournamentId: string): TournamentPlayer[] => {
  switch(tournamentId) {
    case "xzb_6":
      return [
        {
          "id": "yyx",
          "mid":"12345",
          "name": "伊颜轩",
          "face":"https",
          "teamId": undefined,
          "finalRank": 1,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "大粽场",
              "date": 1738814400000,
              "schedule":"Day4",
              "point": 2791.04,
              "ending":"通关【紧急授课】【授法】【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"突击战术分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined, //有可能有竞速赛？
              "rank": 4,
            },
            {
              "stage": "决赛",
              "date": 1739332800000,
              "schedule": "Day2",
              "point": 3162.46,
              "ending":"通关【朝谒】【授法】【不容拒绝】",
              "note": undefined,
              "type": "rank",
              "result": undefined,
              "rival": undefined,
              "starterSquad":"突击战术分队",
              "starterOp": undefined,
              "level": undefined,
              "duration": undefined,
              "rank": 1,
            }
          ]
        },
        {
          "id": "嬅_音",
          "mid":"12345",
          "name": "嬅_音",
          "face":"https",
          "teamId": undefined,
          "finalRank": 3,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "小粽场",
              "date": 1738983600000,
              "schedule":"Day6",
              "point": 3218.95,
              "ending":"通关【紧急授课】【授法】【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"点刺成锭分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined, //有可能有竞速赛？
              "rank": 2,
            },
            {
              "stage": "决赛",
              "date": 1739208600000,
              "schedule": "Day1",
              "point": 2121.6,
              "ending":"通关【朝谒】【授法】",
              "note": undefined,
              "type": "rank",
              "result": undefined,
              "rival": undefined,
              "starterSquad":"拟态学者分队",
              "starterOp": undefined,
              "level": undefined,
              "duration": undefined,
              "rank": 3,
            }
          ]
        },
        {
          "id": "x2048x",
          "mid":"12345",
          "name": "x2048x",
          "face":"https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "大粽场",
              "date": 1738776600000,
              "schedule":"Day4",
              "point": 3301.4,
              "ending":"通关【紧急授课】【授法】【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"点刺成锭分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 1,
            },
            {
              "stage": "决赛",
              "date": 1739246400000,
              "schedule": "Day1",
              "point": 1951.56,
              "ending":"战胜【紧急授课】，死于【授法】",
              "note": undefined,
              "type": "rank",
              "result": undefined,
              "rival": undefined,
              "starterSquad":"点刺成锭分队",
              "starterOp": undefined,
              "level": undefined,
              "duration": undefined,
              "rank": 5,
            }
          ]
        },
        {
          "id": "wys",
          "mid":"12345",
          "name": "维云斯",
          "face": "https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "大粽场",
              "date": 1738537200000,
              "schedule":"Day1",
              "point": 981.72,
              "ending":"死于【紧急授课】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"堡垒战术分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 24,
            }
          ]
        },
        {
          "id": "🐟",
          "mid":"12345",
          "name": "🐟",
          "face": "https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "小粽场",
              "date": 1738551600000,
              "schedule":"Day1",
              "point": 1935,
              "ending":"通关【朝谒】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"远程战术分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 15,
            }
          ]
        },
        {
          "id": "电波鸽紫",
          "mid":"12345",
          "name": "电波鸽紫",
          "face": "https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "小粽场",
              "date": 1738515600000,
              "schedule":"Day1",
              "point": 2118,
              "ending":"通关【魂灵朝谒】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"拟态学者分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 13,
            }
          ]
        },
        {
          "id": "yyy",
          "mid":"12345",
          "name": "余余银",
          "face":"https",
          "teamId": undefined,
          "finalRank": 2,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "大粽场",
              "date": 1738990800000,
              "schedule":"Day6",
              "point": 2787.3,
              "ending":"战胜【朝谒】【授法】，死于【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"点刺成锭分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 5,
            },
            {
              "stage": "决赛",
              "date": 1739329200000,
              "schedule": "Day2",
              "point": 3092.8,
              "ending":"通关【朝谒】【授法】【不容拒绝】",
              "note": undefined,
              "type": "rank",
              "result": undefined,
              "rival": undefined,
              "starterSquad": "蓝图测绘分队",
              "starterOp": undefined,
              "level": undefined,
              "duration": undefined,
              "rank": 2,
            }
          ]
        },
        {
          "id": "黄昏Dusky",
          "mid":"12345",
          "name": "黄昏Dusky",
          "face":"https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "小粽场",
              "date": 1738792800000,
              "schedule":"Day4",
              "point": 2511,
              "ending":"战胜【朝谒】【授法】，死于【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"远程战术分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 6,
            },
            {
              "stage": "决赛",
              "date": 1739206800000,
              "schedule": "Day1",
              "point": 2117.7,
              "ending":"通关【紧急授课】【授法】",
              "note": undefined,
              "type": "rank",
              "result": undefined,
              "rival": undefined,
              "starterSquad": "远程战术分队",
              "starterOp": undefined,
              "level": undefined,
              "duration": undefined,
              "rank": 4,
            }
          ]
        },
        {
          "id": "白菜四條腿",
          "mid":"12345",
          "name": "白菜四條腿",
          "face":"https",
          "teamId": undefined,
          "finalRank": undefined,
          "note": undefined,
          "games": [
            {
              "stage": "初赛",
              "session": "小粽场",
              "date": 1738688400000,
              "schedule":"Day3",
              "point": 2301.04,
              "ending":"战胜【紧急授课】【授法】，死于【不容拒绝】",
              "note": undefined, // 如短脖兔杯的难题
              "type": "rank", // rank|1on1
              "result": undefined, // 1on1状态下的win|lose
              "rival": undefined, // 1on1状态下的对手id
              "starterSquad":"突击战术分队", // 写分队id
              "starterOp": undefined,// ["char_123_yato2"]
              "level": undefined, // N18
              "duration": undefined,
              "rank": 9,
            }
          ]
        },
      ];
    default:
      return [];
  }
};

export const useTournamentDataStore = create<TournamentsStore & TournamentDataAction>(
  (set, get) => ({
    tournamentsData: undefined,
    fetchTournamentsData: async () => {
      // TODO: replace with actual data fetched from backend
      const data: TournamentData[] = mockTournamentDataCall();
      const now = new Date();

      data.forEach((d) => d.ongoing = d.stages.some((s) => new Date(s.startTime) <= now && now <= new Date(s.endTime)));
      data.forEach(async (d) => d.players = mockPlayerDataCall(d.id));

      if (data) {
        set((state) => ({
          ...state,
          tournamentsData: data,
        }));
      }
    },
    fetchTournamentPlayer: async (tournamentId: string) => {
      const tournament = get().tournamentsData?.find((t) => t.id === tournamentId);
      if (!tournament) return;
      tournament.players = mockPlayerDataCall(tournamentId);

      set((state) => ({
        ...state,
        tournamentsData: state.tournamentsData?.map((t) =>
          t.id === tournamentId ? { ...t, players: tournament.players } : t
        ),
      }));
    }
  }),
);

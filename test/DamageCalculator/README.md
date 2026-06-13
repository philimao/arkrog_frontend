# test/DamageCalculator —— 测试现状

> ⚠️ **当前 4/4 用例全红是已知状态，不是你的改动造成的。**

根因：`data/*.json` 夹具是 `BuffContext` 重构前导出的旧 schema，缺 `buffContext` 字段；且 `BuffContext` 是带方法的类实例树，无法由 JSON 直接反序列化回灌。charImpl 第一行解引用 `context.in_game_buff_add` 即抛 `Cannot read properties of undefined`。

不要为了变绿去改金值基线或绕过断言。夹具的正确重建方式（只存原始输入、测试内用 `CalculatorHelper` 的 analyze 管线重建 context）、金值基线管理、以及"数据更新→自动验证"的设计见：

- [09-fixtures-and-baselines.md](../../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md)
- [10-relic-buff-verification.md](../../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md)

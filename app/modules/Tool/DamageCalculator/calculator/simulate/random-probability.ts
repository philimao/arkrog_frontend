/**
 * 该文件用于提供干员技能效果百分比生效判定
 * 但为了测试的完整性, 希望拥有一个种子生成随机结果的函数.
 * 在该种子不变的情况下, 判定结果应该保持一致.
 * 这样在测试脚本中, 对于结果的输出可以保持一致.
 * -------------------------------------------------------------------------
 */

/**
 * xorshift32 伪随机数生成器，提供更好的随机性
 * @param seed 种子值
 * @returns 0-1之间的伪随机数
 */
function seededRandom(seed: number): number {
  // 确保种子不为0（xorshift不能使用0作为种子）
  let x = seed || 1;

  // xorshift32 算法
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;

  // 确保结果为正数并转换为32位无符号整数
  const result = x >>> 0;

  // 转换为0-1之间的浮点数
  return result / 0xffffffff;
}

/**
 * 改进的种子混合函数
 * @param baseSeed 基础种子字符串
 * @param index 索引值
 * @returns 混合后的数字种子
 */
function mixSeed(baseSeed: string, index: number): number {
  // 先将基础种子转换为数字
  let hash = 0;
  for (let i = 0; i < baseSeed.length; i++) {
    const char = baseSeed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // 转换为32位整数
  }

  // 将索引与基础哈希进行复杂混合
  // 使用多个质数来增加随机性
  let mixed = hash;
  mixed = (mixed ^ (index * 2654435761)) | 0; // 使用质数混合
  mixed = (mixed ^ (mixed >>> 16)) | 0;
  mixed = (mixed * 2246822507) | 0;
  mixed = (mixed ^ (mixed >>> 13)) | 0;
  mixed = (mixed * 3266489909) | 0;
  mixed = (mixed ^ (mixed >>> 16)) | 0;

  return Math.abs(mixed);
}

/**
 * 基于固定种子的概率判定函数
 * @param probability 概率值 (0-1)
 * @param attemptCount 尝试次数
 * @returns 是否成功
 */
export function checkProbability(probability: number, attemptCount: number, seed: string): boolean {
  // 使用改进的种子混合
  const numericSeed = mixSeed(seed, attemptCount);

  // 生成0-1之间的伪随机数
  const randomValue = seededRandom(numericSeed);

  return randomValue <= probability;
}

/**
 * 测试随机数生成器的质量
 * @param probability 测试概率
 * @param testCount 测试次数
 */
export function testRandomness(probability: number = 0.25, testCount: number = 10, seed: string) {
  let successCount = 0;
  const randomValues = []; // 记录生成的随机值

  for (let i = 0; i < testCount; i++) {
    const numericSeed = mixSeed(seed, i);
    const randomValue = seededRandom(numericSeed);
    randomValues.push(randomValue.toFixed(4));

    if (checkProbability(probability, i, seed)) {
      successCount++;
    }
  }

  const actualProbability = successCount / testCount;
  const deviation = Math.abs(actualProbability - probability);
  const deviationPercent = (deviation / probability) * 100;

  console.log(`随机数测试结果:`);
  console.log(`期望概率: ${probability} (${probability * 100}%)`);
  console.log(`实际概率: ${actualProbability.toFixed(4)} (${(actualProbability * 100).toFixed(2)}%)`);
  console.log(`偏差: ${deviation.toFixed(4)} (${deviationPercent.toFixed(2)}%)`);
  console.log(`测试次数: ${testCount}`);
  console.log(`生成的随机值:`, randomValues);

  return {
    expected: probability,
    actual: actualProbability,
    deviation,
    deviationPercent,
    testCount,
    randomValues,
  };
}

/**
 * 调试函数：显示连续的随机值
 * @param count 显示数量
 */
export function debugRandomValues(count: number = 10, seed: string) {
  console.log(`前${count}个随机值:`);
  for (let i = 0; i < count; i++) {
    const numericSeed = mixSeed(seed, i);
    const randomValue = seededRandom(numericSeed);
    console.log(`索引${i}: 种子=${numericSeed}, 随机值=${randomValue.toFixed(6)}`);
  }
}

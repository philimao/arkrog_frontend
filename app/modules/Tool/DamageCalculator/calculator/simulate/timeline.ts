import type { Frame } from "./frame";

export class Timeline {
  /** 运行时间（秒) */
  run_time: number;
  /** 帧率 */
  frame_rate: number;
  /** 总帧数 */
  frame_total: number;
  /** 帧 */
  frames: Frame[];

  constructor(run_time: number = 60, frame_rate: number = 30) {
    this.run_time = run_time;
    this.frame_rate = frame_rate;
    this.frame_total = run_time * frame_rate;
    this.frames = [];
  }
}

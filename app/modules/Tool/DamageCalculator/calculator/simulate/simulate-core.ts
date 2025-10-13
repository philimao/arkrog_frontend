import { Frame } from "./frame";
import { Timeline } from "./timeline";

/** 模拟上下文, 存储模拟过程中需要用到的数据和状态 */
export class SimulateContext {
  /** 时间轴 */
  timeline: Timeline = new Timeline();

  /** 当前帧索引 */
  frame_index: number = 0;

  /** 当前帧时间, 根据帧索引计算当前时间精度为秒, 有小数点直接进位 */
  get frame_time() {
    return Math.ceil(this.frame_index / this.timeline.frame_rate);
  }

  addFrame(frame: Frame) {
    this.timeline.frames.push(frame);
    this.frame_index++;
  }
}

export class SimulateCore {
  context: SimulateContext = new SimulateContext();

  /** 推进时间轴 */
  execute_timeline() {
    // 每运行一次, 时间轴向前推进1帧
    while (this.context.frame_index < this.context.timeline.frame_total) {
      this.execute_frame();
    }
  }

  /** 推进帧 */
  private execute_frame() {
    // 本次运行帧索引
    const frame_index = this.context.timeline.frames.length;
    const frame_time = Math.ceil(frame_index / this.context.timeline.frame_rate);
    const frame = new Frame(frame_index, frame_time);
    this.context.addFrame(frame);
  }
}

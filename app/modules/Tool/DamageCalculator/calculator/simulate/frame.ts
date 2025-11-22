export class Frame {
  /** 帧索引 在当前运行时间的第几帧 */
  frame_index: number;
  /** 帧时间 当前帧的时间 */
  frame_time: number;

  /**
   * 帧
   * @param frame_index 帧索引
   * @param frame_time 帧时间
   */
  constructor(frame_index: number, frame_time: number) {
    this.frame_index = frame_index;
    this.frame_time = frame_time;
  }
}

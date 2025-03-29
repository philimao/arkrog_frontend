import React from "react";
import { Svg, type SvgProps } from "../Svg";

export const FolderIcon: React.FC<SvgProps> = (props) => (
  <Svg {...props} aria-label={props.label} viewBox="0 0 30 30">
    <g id="SVGRepo_iconCarrier">
      <path
        className="st4"
        d="M24,26H6c-2.2,0-4-1.8-4-4v-9c0-2.2,1.8-4,4-4h18c2.2,0,4,1.8,4,4v9C28,24.2,26.2,26,24,26z"
        fill="#0691CD"
      />
      <path
        className="st5"
        d="M13.1,4H6C3.8,4,2,5.8,2,8v14c0,2.2,1.8,4,4,4h18c0.5,0,0.9-0.1,1.3-0.2L13.1,4z"
        fill="#18D1FF"
      />
    </g>
  </Svg>
);

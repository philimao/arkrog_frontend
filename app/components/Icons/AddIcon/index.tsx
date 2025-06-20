import React from 'react';
import { Svg, type SvgProps } from "../Svg";

export const AddIcon: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 12 12" {...props}>
    <g clipPath="url(#clip0_728_7485)">
      <path
        d="M6.69231 0.692308V5.30769H11.3077C11.6827 5.30769 12 5.625 12 6C12 6.40385 11.6827 6.69231 11.3077 6.69231H6.69231V11.3077C6.69231 11.7115 6.375 12 6 12C5.59615 12 5.30769 11.7115 5.30769 11.3077V6.69231H0.692308C0.288462 6.69231 0 6.40385 0 6C0 5.625 0.288462 5.30769 0.692308 5.30769H5.30769V0.692308C5.30769 0.317308 5.59615 0 6 0C6.375 0 6.69231 0.317308 6.69231 0.692308Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_728_7485">
        <rect width="12" height="12" fill="white" />
      </clipPath>
    </defs>
  </Svg>
);

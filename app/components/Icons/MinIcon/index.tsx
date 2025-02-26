import React from 'react';
import { Svg, type SvgProps } from '../Svg';

export const MinIcon: React.FC<SvgProps> = (props) => (
  <Svg {...props} aria-label={props.label} viewBox="0 0 24 24">
    <path
      d="M2 22L2.875 21.125M9 15H3.14286M9 15V20.8571M9 15L5.5 18.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 2L15 9M15 9H20.8571M15 9V3.14286"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

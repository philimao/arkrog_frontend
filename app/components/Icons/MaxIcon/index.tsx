import React from 'react';
import { Svg, type SvgProps } from '../Svg';

export const MaxIcon: React.FC<SvgProps> = (props) => (
  <Svg {...props} aria-label={props.label} viewBox="0 0 24 24">
    <path
      d="M22 2H16.1429M22 2V7.85714M22 2L18.5 5.5M15 9L15.875 8.125"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 15L2 22M2 22H7.85714M2 22V16.1429"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

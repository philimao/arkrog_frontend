import React from 'react';
import { Svg, type SvgProps } from '../Svg';

export const ModalCloseIcon: React.FC<SvgProps> = (props) => (
  <Svg {...props} aria-label={props.label} viewBox="0 0 14 14">
    <g clipPath="url(#clip0_113_129)">
      <path
        d="M0.204445 1.19591C0.139396 1.13086 0.0877958 1.05364 0.0525914 0.968644C0.017387 0.883653 -0.000732421 0.79256 -0.000732422 0.700567C-0.000732423 0.608573 0.017387 0.517481 0.0525914 0.43249C0.0877958 0.347499 0.139396 0.270274 0.204445 0.205225C0.269494 0.140176 0.346719 0.0885758 0.43171 0.0533714C0.516701 0.018167 0.607793 4.75545e-05 0.699787 4.75552e-05C0.79178 4.75559e-05 0.882873 0.018167 0.967864 0.0533714C1.05285 0.0885758 1.13008 0.140176 1.19513 0.205225L13.794 12.8041C13.9254 12.9355 13.9992 13.1137 13.9992 13.2995C13.9992 13.4853 13.9254 13.6635 13.794 13.7948C13.6627 13.9262 13.4845 14 13.2987 14C13.1129 14 12.9347 13.9262 12.8034 13.7948L6.99924 7.98963L1.19513 13.7943C1.0639 13.9257 0.885856 13.9995 0.700168 13.9996C0.514479 13.9997 0.336356 13.9261 0.204983 13.7948C0.0736105 13.6636 -0.000250728 13.4856 -0.0003517 13.2999C-0.000452671 13.1142 0.0732149 12.9361 0.204445 12.8047L6.00964 7.00003L0.204983 1.19591H0.204445ZM12.8502 0.197149C12.9127 0.134645 12.9869 0.0850641 13.0686 0.0512373C13.1502 0.0174104 13.2378 0 13.3262 0C13.4146 0 13.5021 0.0174104 13.5837 0.0512373C13.6654 0.0850641 13.7396 0.134645 13.8021 0.197149C13.8646 0.259653 13.9142 0.333855 13.948 0.415521C13.9819 0.497186 13.9993 0.584714 13.9993 0.673108C13.9993 0.761502 13.9819 0.84903 13.948 0.930695C13.9142 1.01236 13.8646 1.08656 13.8021 1.14907L9.76401 5.18718C9.7015 5.24968 9.6273 5.29927 9.54563 5.33309C9.46397 5.36692 9.37644 5.38433 9.28805 5.38433C9.10953 5.38433 8.93832 5.31341 8.81209 5.18718C8.74958 5.12468 8.7 5.05047 8.66618 4.96881C8.63235 4.88714 8.61494 4.79962 8.61494 4.71122C8.61494 4.5327 8.68586 4.3615 8.81209 4.23526L12.8502 0.197149Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_113_129">
        <rect width="14" height="14" fill="currentColor" />
      </clipPath>
    </defs>
  </Svg>
);

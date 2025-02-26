import React from 'react';

import { Svg, type SvgProps } from '../Svg';

type Direction = 'up' | 'right' | 'down' | 'left';

const dirTransform = {
  up: '270',
  right: '0',
  down: '90',
  left: '180',
};

interface ArrowProps extends SvgProps {
  /** Defines the direction of the arrow. */
  direction?: Direction;
}

function getTransform(dir: Direction) {
  return `rotate(${dirTransform[dir]}deg)`;
}

export const ArrowIcon: React.FC<ArrowProps> = ({ direction = 'right', ...rest }) => (
  <Svg style={{ transform: getTransform(direction) }} viewBox="0 0 17 16" {...rest}>
    <path
      d="M16.7071 8.70711C17.0976 8.31658 17.0976 7.68342 16.7071 7.29289L10.3431 0.928932C9.95262 0.538408 9.31946 0.538408 8.92893 0.928932C8.53841 1.31946 8.53841 1.95262 8.92893 2.34315L14.5858 8L8.92893 13.6569C8.53841 14.0474 8.53841 14.6805 8.92893 15.0711C9.31946 15.4616 9.95262 15.4616 10.3431 15.0711L16.7071 8.70711ZM0 9L16 9V7L0 7L0 9Z"
    />
  </Svg>
);

export const ArrowUpIcon = (props: Omit<ArrowProps, 'direction'>) => (
  <ArrowIcon {...props} direction="up" />
);
export const ArrowRightIcon = (props: Omit<ArrowProps, 'direction'>) => (
  <ArrowIcon {...props} direction="right" />
);
export const ArrowDownIcon = (props: Omit<ArrowProps, 'direction'>) => (
  <ArrowIcon {...props} direction="down" />
);
export const ArrowLeftIcon = (props: Omit<ArrowProps, 'direction'>) => (
  <ArrowIcon {...props} direction="left" />
);

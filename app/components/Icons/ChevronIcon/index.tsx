import React from 'react';

import { Svg, type SvgProps } from '../Svg';

type Direction = 'up' | 'right' | 'down' | 'left';

const dirTransform = {
  up: '0',
  right: '90',
  down: '180',
  left: '270',
};

interface ChevronProps extends SvgProps {
  /** Defines the direction of the chevron. */
  direction?: Direction;
}

function getTransform(dir: Direction) {
  return `rotate(${dirTransform[dir]}deg)`;
}

export const ChevronIcon: React.FC<ChevronProps> = ({ direction = 'up', ...rest }) => (
  <Svg style={{ transform: getTransform(direction) }} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path d="M106.666667 659.2L172.8 725.333333 512 386.133333 851.2 725.333333l66.133333-66.133333L512 256z"></path>
  </Svg>
);

export const ChevronUpIcon = (props: Omit<ChevronProps, 'direction'>) => (
  <ChevronIcon {...props} direction="up" />
);
export const ChevronRightIcon = (props: Omit<ChevronProps, 'direction'>) => (
  <ChevronIcon {...props} direction="right" />
);
export const ChevronDownIcon = (props: Omit<ChevronProps, 'direction'>) => (
  <ChevronIcon {...props} direction="down" />
);
export const ChevronLeftIcon = (props: Omit<ChevronProps, 'direction'>) => (
  <ChevronIcon {...props} direction="left" />
);

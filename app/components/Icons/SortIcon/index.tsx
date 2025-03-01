import React from 'react';
import { Svg, type SvgProps } from '../Svg';

type Order = 'asc' | 'desc';

interface SortProps extends SvgProps {
  /** Defines the direction of the arrow. */
  order?: Order;
}

export const SortIcon: React.FC<SortProps> = ({ order = 'asc', ...rest }) => (
  <Svg {...rest}>
    {order === 'asc' ? (
      <>TBD</>
    ) : (
      <>TBD</>
    )}
  </Svg>
);

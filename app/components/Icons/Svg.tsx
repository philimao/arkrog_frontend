import React from 'react';

export interface SvgProps extends React.SVGAttributes<HTMLOrSVGElement> {
  className?: string;
  viewBox?: string;
  label?: string;
}

export interface FilledProps extends SvgProps {
  filled?: boolean;
}

export const Svg: React.FC<SvgProps> = ({
  className,
  children,
  viewBox,
  xmlns = 'http://www.w3.org/2000/svg',
  width = '16px',
  height = '16px',
  style,
  ...props
}) => {
  return (
    <svg
      xmlns={xmlns}
      className={className}
      style={style}
      viewBox={viewBox}
      width={width}
      height={height}
      {...props}
    >
      <g fill={props.fill || 'currentColor'}>
        {children}
      </g>
    </svg>
  );
};

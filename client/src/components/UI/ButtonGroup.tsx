import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup = (props: Props): JSX.Element => {
  const { children, className = '' } = props;

  return (
    <div className={`btn-group ${className}`} role="group">
      {children}
    </div>
  );
}; 
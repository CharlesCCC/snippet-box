import { Color } from '../../typescript/types';
import React from 'react';

interface Props {
  text?: string;
  color?: Color;
  variant?: string; // 'primary', 'outline-secondary', etc.
  outline?: boolean;
  small?: boolean;
  size?: string; // 'sm', 'lg', etc.
  handler?: () => void;
  onClick?: () => void;
  classes?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
}

export const Button = (props: Props): JSX.Element => {
  const {
    text,
    color,
    variant,
    outline = false,
    small = false,
    size,
    handler,
    onClick, 
    classes = '',
    type = 'button',
    children
  } = props;

  // Support both old and new style props
  const buttonText = children || text;
  const clickHandler = onClick || handler;
  
  // Support both styles of setting button appearance
  let buttonClasses = ['btn'];
  
  if (variant) {
    // New style using variant
    buttonClasses.push(`btn-${variant}`);
  } else {
    // Old style using color and outline
    buttonClasses.push(outline ? `btn-outline-${color}` : `btn-${color}`);
  }
  
  // Size can be set via size prop or small prop
  if (size) {
    buttonClasses.push(`btn-${size}`);
  } else if (small) {
    buttonClasses.push('btn-sm');
  }
  
  // Add any custom classes
  if (classes) {
    buttonClasses.push(classes);
  }

  return (
    <button type={type} className={buttonClasses.join(' ')} onClick={clickHandler}>
      {buttonText}
    </button>
  );
};

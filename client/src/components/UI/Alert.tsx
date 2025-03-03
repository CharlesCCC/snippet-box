import React from 'react';

interface AlertProps {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onDismiss }) => {
  return (
    <div 
      className={`alert alert-${type} ${onDismiss ? 'alert-dismissible' : ''} fade show`} 
      role="alert"
    >
      {message}
      {onDismiss && (
        <button 
          type="button" 
          className="btn-close" 
          data-bs-dismiss="alert" 
          aria-label="Close"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  );
}; 
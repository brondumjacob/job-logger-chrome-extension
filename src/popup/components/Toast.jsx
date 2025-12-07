import React from 'react';

const Toast = ({ message, type = 'success' }) => {
  const bgColor = type === 'success' ? '#059669' : '#dc2626';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className="toast" style={{ background: bgColor }}>
      <span>{icon}</span>
      {message}
    </div>
  );
};

export default Toast;

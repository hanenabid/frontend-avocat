import React from 'react';

const IconCourthouse = ({ className = '', width = 36, height = 36 }) => (
  <img
    src="/logo.png"
    alt="Juridika Logo"
    className={className}
    width={width}
    height={height}
    style={{
      objectFit: 'contain',
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '4px',
      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
    }}
  />
);

export default IconCourthouse;

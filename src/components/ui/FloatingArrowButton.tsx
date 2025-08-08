import React from 'react';

interface FloatingArrowButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

const FloatingArrowButton: React.FC<FloatingArrowButtonProps> = ({ open, onClick, className }) => (
  <button
    className={`fixed top-30 left-2 z-[10001] bg-white/90 hover:bg-white shadow-lg rounded-full p-2 flex items-center justify-center border border-gray-200 transition ${
      className || ''
    }`}
    style={{ width: 48, height: 48 }}
    onClick={onClick}
    aria-label={open ? 'Hide info' : 'Show info'}
  >
    <span className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
  </button>
);

export default FloatingArrowButton;

import React from 'react';
import { FaInfo } from 'react-icons/fa6';

interface FloatingArrowButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

const FloatingArrowButton: React.FC<FloatingArrowButtonProps> = ({ open, onClick, className }) => (
  <button
    className={`fixed top-3 left-3 z-[10001] h-11 w-11 shrink-0 bg-white/95 hover:bg-white shadow-md rounded-full p-0 flex items-center justify-center border-2 border-gray-300 transition ${
      className || ''
    }`}
    onClick={onClick}
    aria-label={open ? 'Hide info' : 'Show info'}
  >
    <span className={`text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
      <FaInfo />
    </span>
  </button>
);

export default FloatingArrowButton;

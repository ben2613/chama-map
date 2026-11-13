import React from 'react';
import { FaInfo } from 'react-icons/fa6';

interface FloatingArrowButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

const controlBtnClass = `
  w-11 h-11 shrink-0 p-0 bg-white border-2 rounded-sm
  flex items-center justify-center leading-none
  hover:bg-gray-50 active:bg-gray-100
  transition-colors duration-150 cursor-pointer
`;

const FloatingArrowButton: React.FC<FloatingArrowButtonProps> = ({ open, onClick, className }) => (
  <button
    type="button"
    className={`chama-map-control fixed top-3 left-3 z-[10001] ${controlBtnClass} ${
      open ? 'border-red-400 text-red-500 bg-red-50' : 'border-gray-300 text-gray-700'
    } ${className || ''}`}
    data-control-position="topleft"
    onClick={onClick}
    aria-label={open ? 'Hide info' : 'Show info'}
    aria-pressed={open}
  >
    <FaInfo className="text-base block" aria-hidden />
  </button>
);

export default FloatingArrowButton;

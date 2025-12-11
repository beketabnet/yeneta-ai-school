import React from 'react';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '../../icons/Icons';

interface MobileConfigToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

const MobileConfigToggle: React.FC<MobileConfigToggleProps> = ({ isOpen, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`
                lg:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300
                ${isOpen
                    ? 'bg-gray-800 text-white rotate-90'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-110'
                }
            `}
            title={isOpen ? "Close Settings" : "Open Tutor Settings"}
        >
            {isOpen ? <XMarkIcon className="w-6 h-6" /> : <AdjustmentsHorizontalIcon className="w-6 h-6" />}

            {!isOpen && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center font-bold">1</span>
                </span>
            )}
        </button>
    );
};

export default MobileConfigToggle;

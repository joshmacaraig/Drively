'use client';

import { useEffect } from 'react';
import { X, CheckCircle, Warning, Info, XCircle } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-500',
          icon: <CheckCircle size={24} weight="fill" className="text-green-500" />,
          text: 'text-green-900',
          closeBtn: 'text-green-500 hover:text-green-700 hover:bg-green-100'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-500',
          icon: <XCircle size={24} weight="fill" className="text-red-500" />,
          text: 'text-red-900',
          closeBtn: 'text-red-500 hover:text-red-700 hover:bg-red-100'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-500',
          icon: <Warning size={24} weight="fill" className="text-yellow-500" />,
          text: 'text-yellow-900',
          closeBtn: 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-500',
          icon: <Info size={24} weight="fill" className="text-blue-500" />,
          text: 'text-blue-900',
          closeBtn: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-500',
          icon: <Info size={24} weight="fill" className="text-gray-500" />,
          text: 'text-gray-900',
          closeBtn: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`${styles.bg} border-l-4 rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in`}
    >
      {styles.icon}
      <div className="flex-1">
        <p className={`${styles.text} font-semibold text-sm`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`${styles.closeBtn} p-1 rounded-lg transition-all`}
      >
        <X size={18} weight="bold" />
      </button>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

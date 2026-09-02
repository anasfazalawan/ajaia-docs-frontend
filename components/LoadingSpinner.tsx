'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
  xl: 'h-14 w-14 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  label,
  className = '',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse ring */}
        <div
          className={`${
            size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-20 w-20'
          } absolute animate-ping rounded-full bg-indigo-400 opacity-20`}
        />
        {/* Main spinning ring */}
        <div
          className={`${sizeMap[size]} animate-spin rounded-full border-gray-200 border-t-indigo-600`}
        />
      </div>
      {label && <p className="text-sm font-medium text-gray-500 animate-pulse">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#fafaf9] p-4">
        {spinnerElement}
      </main>
    );
  }

  return spinnerElement;
}

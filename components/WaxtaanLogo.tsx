import type React from 'react';
import Image from 'next/image';

interface WaxtaanLogoProps {
  compact?: boolean;
}

export const WaxtaanLogo: React.FC<WaxtaanLogoProps> = ({ compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${compact ? '' : 'h-full'}`}>
      <div className={compact ? "mb-4" : "mb-8"}>
        <Image src="/waxtaan.png" alt="Waxtaan Logo" width={compact ? 80 : 140} height={compact ? 80 : 140} />
      </div>
      {!compact && (
        <>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#128C7E] mb-2 tracking-tight">Waxtaan Web</h1>
          <p className="text-gray-500 text-base mb-4 text-center max-w-xs">Sélectionnez une conversation pour commencer à discuter</p>
        </>
      )}
    </div>
  );
};

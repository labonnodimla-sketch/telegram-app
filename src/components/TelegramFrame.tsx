import React from 'react';

interface TelegramFrameProps {
  children: React.ReactNode;
}

export const TelegramFrame: React.FC<TelegramFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <main className="w-full max-w-md min-h-screen bg-slate-950 flex flex-col relative shadow-2xl">
        {children}
      </main>
    </div>
  );
};

import React from 'react';

export const DevTools: React.FC = () => {
  if (import.meta.env.PROD) return null;
  return (
    <div className="fixed bottom-2 right-2 px-3 py-1 text-[10px] rounded-full bg-slate-900 text-slate-100 opacity-70">
      DevTools stub
    </div>
  );
};

import { ReactNode } from "react";

const GlassContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={`w-full glass-brand max-h-screen overflow-y-auto rounded-2xl p-6`}
    >
      {children}
    </div>
  );
};

export default GlassContainer;

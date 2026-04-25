"use client";

interface AddNodeButtonProps {
  onClick: () => void;
}

export function AddNodeButton({ onClick }: AddNodeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-[22px] w-[22px] rounded-full bg-white text-sm leading-none transition-all hover:scale-[1.12] hover:border-accent-blue hover:text-accent-blue hover:bg-[oklch(0.68_0.18_255/0.06)] shrink-0"
      style={{
        border: "1.5px dashed rgba(0,0,0,0.18)",
        color: "rgba(0,0,0,0.28)",
        fontSize: "14px",
      }}
    >
      +
    </button>
  );
}

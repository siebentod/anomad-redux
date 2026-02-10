interface ExcludeButtonProps {
  onClick: () => void;
}

export default function ExcludeButton({ onClick }: ExcludeButtonProps) {
  return (
    <button
      className="h-[24px] bg-red-bg hover:bg-red-bg-hover rounded-sm text-black flex items-center justify-center text-sm px-2"
      onClick={onClick}
    >
      Exclude
    </button>
  );
}
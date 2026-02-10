interface SearchButtonProps {
  onClick: () => void;
}

export default function SearchButton({ onClick }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      type="submit"
      className="h-[24px] bg-red-bg hover:bg-red-bg-hover rounded-sm text-black flex items-center justify-center text-sm px-2"
    >
      Search
    </button>
  );
}
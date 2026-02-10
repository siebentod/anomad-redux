interface SearchFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export default function SearchForm({ onSubmit, children }: SearchFormProps) {
  return (
    <form
      className="flex justify-center items-center mb-8 gap-1"
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}
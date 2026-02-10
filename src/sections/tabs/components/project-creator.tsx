import { useState, useRef, useEffect } from 'react';

interface ProjectCreatorProps {
  onCreate: (projectName: string) => void;
  tabsCount: number;
}

export function ProjectCreator({ onCreate, tabsCount }: ProjectCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      inputRef.current?.focus();
    }
  }, [isCreating]);

  const handleCreateNew = () => {
    if (newProjectName.trim()) {
      onCreate(newProjectName.trim());
    }
    setIsCreating(false);
    setNewProjectName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewProjectName('');
    }
  };

  return (
    <>
      {isCreating ? (
        <input
          ref={inputRef}
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCreateNew}
          className="py-2 px-4 text-lg font-bold border-0 ring-0 focus:ring-0 focus:outline-none text-white"
          placeholder="Project name..."
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="py-2 px-4 text-lg font-bold text-gray-500 hover:text-gray-400"
          title="Create new"
        >
          {tabsCount ? '+' : '+ Создать проект'}
        </button>
      )}
    </>
  );
}
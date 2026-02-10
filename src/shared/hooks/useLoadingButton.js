import { useState, useEffect } from 'react';

function useLoadingButton(onClick, externalLoading = false) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(externalLoading);
  }, [externalLoading]);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, onClick: handleClick };
}

export default useLoadingButton;

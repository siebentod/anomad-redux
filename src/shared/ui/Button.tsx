import Loader from 'src/shared/assets/icons/Loader.svg?react';
import useLoadingButton from 'src/shared/hooks/useLoadingButton';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
    primary,
    onClick = () => {},
    loading = false,
    children,
    className = "",
    ...props
  }: ButtonProps) {
    const externalLoading = loading;
    const { isLoading, onClick: handleClick } = useLoadingButton(onClick, externalLoading);
  
    return (
      <button
        {...props}
        className={`w-full py-[14px] md:px-[24px] rounded-lg transition-colors duration-300 md:text-[15px] font-[700] leading-5 md:leading-6 relative flex items-center justify-center ${
          primary
            ? "bg-red-bg border-2 border-red-bg text-white hover:bg-red-bg-hover"
            : "bg-white border-2 border-red-bg text-red-bg hover:bg-blueLight"
        } ${className}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        {(isLoading || externalLoading) && (
          <Loader className="animate-spin h-4 w-4 md:h-6 md:w-6 absolute ml-[110px]" />
        )}
        <span className={`${isLoading ? "opacity-70" : ""}`}>{children}</span>
      </button>
    );
  }

import SettingsSvg from 'src/shared/assets/icons/Settings.svg?react';

interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      className="w-[24px] h-[24px] bg-red-bg hover:bg-red-bg-hover rounded-sm text-black flex items-center justify-center"
      onClick={onClick}
    >
      <SettingsSvg className="w-4 h-4" />
    </button>
  );
}

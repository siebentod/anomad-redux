import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from 'src/redux';
import { selectSettings } from 'src/redux/settings/settingsSelectors';
import { setSetting } from 'src/redux/settings/settingsSlice';
import type { Settings as SettingsType } from 'src/shared/types';

interface SettingsPageProps {
  closeModal: () => void;
}

function SettingsPage({ closeModal }: SettingsPageProps) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const [tempSettings, setTempSettings] = useState<SettingsType>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setTempSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    Object.entries(tempSettings).forEach(([key, value]) => {
      dispatch(setSetting({ key, value }));
    });
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Типы</h4>
          </div>
          <input
            type="text"
            className="border"
            value={tempSettings.types?.join(',')}
            readOnly
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Путь к читалке PDF</h4>
          </div>
          <input
            type="text"
            className="border px-2 py-1 min-w-[300px] flex-1 max-w-xs"
            value={tempSettings.pdfReaderPath || ''}
            onChange={(e) => handleInputChange('pdfReaderPath', e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500">Пример: C:\Program Files\Tracker Software\PDF Editor\PDFXEdit.exe</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={closeModal}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:red-bg-hover text-white rounded-md font-medium transition-colors"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;

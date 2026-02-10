// основной файл с реализациями команд

use chrono::{DateTime, TimeZone, Utc};
use everything_rs::{Everything, EverythingRequestFlags, EverythingSort};
use fs2::FileExt;
use regex::Regex;
use serde::Deserialize;
use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::fs::OpenOptions;
use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::command;
use tokio::sync::Mutex;
use tokio::time::{sleep, timeout};

lazy_static::lazy_static! {
    static ref EVERYTHING_LOCK: Arc<Mutex<()>> = Arc::new(Mutex::new(()));
    static ref LAST_SEARCH_TIME: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
}

use super::utils::filetime_to_datetime::filetime_to_datetime;
use super::utils::get_file_info::get_file_info;
use super::utils::get_file_highlights::get_file_highlights;
use super::utils::get_file_info_all_meta::get_file_info_all_meta;
use super::utils::set_creator::set_creator;

// Параметры для функции поиска
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchParams {
    pub query: String,
    pub path: Option<String>,
    pub count: Option<u32>,
    pub include_highlights: Option<bool>,
}

// Определяем FileMetadata здесь, так как она тесно связана с операциями с файлами
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadata {
    pub file_name: String,
    pub full_path: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileResult {
    pub file_name: String,
    pub full_path: String,
    pub title: String,

    pub size: Option<u64>,
    pub created_date: String,
    pub modified_date: String,
    pub extension: Option<String>,
    pub is_locked: bool,
    pub id: Option<String>,
    pub pdf_title: Option<String>,
    pub pdf_author: Option<String>,
    pub pdf_creator: Option<String>,
    pub highlights: Option<Vec<crate::commands::utils::get_file_highlights::Highlight>>,
}

#[command]
pub async fn get_everything(params: SearchParams) -> Result<Vec<FileResult>, String> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }

    match everything_search(&params, false).await {
        Some(results) => Ok(results),
        None => Err("Ошибка выполнения поиска".to_string()),
    }
}

#[command]
pub async fn get_everything_with_meta(params: SearchParams) -> Result<Vec<FileResult>, String> {
    if params.query.trim().is_empty() {
        return Ok(Vec::new());
    }

    match everything_search(&params, true).await {
        Some(results) => Ok(results),
        None => Err("Ошибка выполнения поиска".to_string()),
    }
}


// Второй параметр false -> быстрый поиск без метаданных, true - с метаданными
async fn everything_search(params: &SearchParams, use_full_meta: bool) -> Option<Vec<FileResult>> {
    const MIN_SEARCH_INTERVAL_MS: u64 = 100;
    const MAX_TOTAL_HIGHLIGHT_SEARCHES: u32 = 11;
    const MAX_FILES_WITH_HIGHLIGHTS: usize = 7;
    const DEFAULT_RESULTS_COUNT: u32 = 20;

    let include_highlights = use_full_meta || params.include_highlights.unwrap_or(false);
    let max_results = params.count.unwrap_or(DEFAULT_RESULTS_COUNT);

    let sleep_duration = {
        let last_time = LAST_SEARCH_TIME.lock().await;
        if let Some(last) = *last_time {
            let elapsed = last.elapsed();
            if elapsed < Duration::from_millis(MIN_SEARCH_INTERVAL_MS) {
                Some(Duration::from_millis(MIN_SEARCH_INTERVAL_MS) - elapsed)
            } else {
                None
            }
        } else {
            None
        }
    };

    if let Some(duration) = sleep_duration {
        sleep(duration).await;
    }

    let files = {
        // Пытаемся получить блокировку с таймаутом 5 секунд
        let lock_result = timeout(Duration::from_secs(5), EVERYTHING_LOCK.lock()).await;
        let _lock = match lock_result {
            Ok(lock) => lock,
            Err(_) => return None,
        };

        {
            let mut last_time = LAST_SEARCH_TIME.lock().await;
            *last_time = Some(Instant::now());
        }

        let everything = Everything::new();
        everything.set_search(params.query.as_str());

        if include_highlights {
            // Set the request flags for the search
            everything.set_request_flags(
                EverythingRequestFlags::FullPathAndFileName
                    | EverythingRequestFlags::DateCreated
                    | EverythingRequestFlags::DateModified
                    | EverythingRequestFlags::Size
                    | EverythingRequestFlags::Extension
                    | EverythingRequestFlags::FileListFileName,
            );
            everything.set_sort(EverythingSort::DateModifiedDescending);
            everything.set_max_results(max_results);

            if let Err(e) = everything.query() {
                eprintln!("Ошибка запроса: {}", e);
                return None;
            }

            let num_results = everything.get_result_count();
            let mut files_with_highlights = 0;
            let mut files_searched_for_highlights = 0;
            let mut should_search_highlights = true;

            let results: Vec<FileResult> = (0..num_results)
                .filter_map(|idx| {
                    if let Ok(path) = everything.get_result_full_path(idx) {
                        use std::path::Path;

                        let path_ref = Path::new(&path);
                        let file_name = path_ref
                            .file_name()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_default();
                        let file_stem = path_ref
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or_default();
                        let title = file_stem.to_string();

                        let info = if use_full_meta {
                            get_file_info_all_meta(&path)
                        } else {
                            get_file_info(&path)
                        };

                        // Определяем, нужно ли искать хайлайты в этом файле
                        let highlights = if should_search_highlights {
                            files_searched_for_highlights += 1;
                            
                            match get_file_highlights(&path) {
                                Ok(hl) => {
                                    if !hl.is_empty() {
                                        files_with_highlights += 1;
                                    }
                                    
                                    // Проверяем условия остановки поиска хайлайтов
                                    if files_with_highlights >= MAX_FILES_WITH_HIGHLIGHTS 
                                        || files_searched_for_highlights >= MAX_TOTAL_HIGHLIGHT_SEARCHES {
                                        should_search_highlights = false;
                                    }
                                    
                                    Some(hl)
                                }
                                Err(_) => {
                                    // Если не удалось получить хайлайты, возвращаем пустой массив
                                    Some(Vec::new())
                                }
                            }
                        } else {
                            // Хайлайты не ищем - None означает, что поиск не проводился
                            None
                        };

                        Some(FileResult {
                            file_name,
                            full_path: path.clone(),
                            title: title.to_string(),
                            size: everything.get_result_size(idx).ok(),
                            created_date: everything
                                .get_result_created_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            modified_date: everything
                                .get_result_count_modified_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            extension: everything.get_result_extension(idx).ok(),
                            is_locked: info.is_locked,
                            id: info.file_id,
                            pdf_title: info.pdf_title,
                            pdf_author: info.pdf_author,
                            pdf_creator: info.pdf_creator,
                            highlights,
                        })
                    } else {
                        None
                    }
                })
                .collect();

            Some(results)
        } else {
            // Original logic for when highlights are not needed
            everything.set_max_results(max_results);
            everything.set_request_flags(
                EverythingRequestFlags::FullPathAndFileName
                    | EverythingRequestFlags::DateCreated
                    | EverythingRequestFlags::DateModified
                    | EverythingRequestFlags::Size
                    | EverythingRequestFlags::Extension
                    | EverythingRequestFlags::FileListFileName,
            );
            everything.set_sort(EverythingSort::DateModifiedDescending);

            if let Err(e) = everything.query() {
                eprintln!("Ошибка запроса: {}", e);
                return None;
            }

            let num_results = everything.get_result_count();
            let results: Vec<FileResult> = (0..num_results)
                .filter_map(|idx| {
                    if let Ok(path) = everything.get_result_full_path(idx) {
                        use std::path::Path;

                        let path_ref = Path::new(&path);
                        let file_name = path_ref
                            .file_name()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_default();
                        let file_stem = path_ref
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or_default();
                        let title = file_stem.to_string();

                        let info = if use_full_meta {
                            get_file_info_all_meta(&path)
                        } else {
                            get_file_info(&path)
                        };

                        let highlights = if include_highlights {
                            get_file_highlights(&path).ok()
                        } else {
                            None
                        };

                        Some(FileResult {
                            file_name,
                            full_path: path.clone(),
                            title: title.to_string(),
                            size: everything.get_result_size(idx).ok(),
                            created_date: everything
                                .get_result_created_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            modified_date: everything
                                .get_result_count_modified_date(idx)
                                .ok()
                                .map_or(String::new(), filetime_to_datetime),
                            extension: everything.get_result_extension(idx).ok(),
                            is_locked: info.is_locked,
                            id: info.file_id,
                            pdf_title: info.pdf_title,
                            pdf_author: info.pdf_author,
                            pdf_creator: info.pdf_creator,
                            highlights,
                        })
                    } else {
                        None
                    }
                })
                .collect();

            Some(results)
        }
    };

    sleep(Duration::from_millis(10)).await;

    files
}

#[command]
pub async fn edit_filename(
    original_full_path: String,
    new_filename: String,
) -> Result<String, String> {
    let original_path = PathBuf::from(&original_full_path);

    // Проверяем, существует ли оригинальный файл
    if !original_path.exists() {
        return Err(format!(
            "Оригинальный файл не найден: {}",
            original_full_path
        ));
    }

    // Создаем полный путь к новому файлу в той же директории
    let parent_dir = original_path
        .parent()
        .ok_or_else(|| "Не удалось получить родительскую директорию файла".to_string())?;
    let new_full_path = parent_dir.join(&new_filename);

    // Проверяем, существует ли файл с новым именем (чтобы избежать перезаписи)
    if new_full_path.exists() {
        return Err(format!(
            "Файл с именем '{}' уже существует в этой директории.",
            new_filename
        ));
    }

    // Переименовываем файл
    match fs::rename(&original_path, &new_full_path) {
        Ok(_) => Ok(new_full_path.to_string_lossy().into_owned()),
        Err(e) => {
            // Обработка конкретных ошибок для более информативных сообщений
            if e.kind() == io::ErrorKind::PermissionDenied {
                Err(format!("Ошибка доступа при переименовании файла: {}. Убедитесь, что у приложения есть необходимые разрешения.", e))
            } else {
                Err(format!("Не удалось переименовать файл: {}", e))
            }
        }
    }
}

#[derive(Deserialize)]
pub struct OpenFileParams {
    path: String,
    page: Option<u32>,
    program_path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct OpenFileResult {
    success: bool,
    path: String,
}

#[command]
pub async fn open_file(params: OpenFileParams) -> Result<OpenFileResult, String> {
    let OpenFileParams { path, page, program_path } = params;

    #[cfg(target_os = "windows")]
    {
        let (success, used_path) = if let Some(page_num) = page {
            // Если указана страница и это PDF
            if path.to_lowercase().ends_with(".pdf") {
                // Сначала проверяем, передан ли program_path
                if let Some(prog_path) = program_path {
                    // Используем переданную программу
                    if Path::new(&prog_path).exists() {
                        match Command::new(&prog_path)
                            .arg("/A")
                            .arg(format!("page={}", page_num))
                            .arg(&path)
                            .spawn() {
                            Ok(_) => (true, prog_path),
                            Err(_) => {
                                // Если program_path не сработал, открываем через explorer
                                match Command::new("explorer").arg(&path).spawn() {
                                    Ok(_) => (false, "explorer".to_string()),
                                    Err(_) => (false, "explorer".to_string()),
                                }
                            }
                        }
                    } else {
                        // program_path не существует, открываем через explorer
                        match Command::new("explorer").arg(&path).spawn() {
                            Ok(_) => (false, "explorer".to_string()),
                            Err(_) => (false, "explorer".to_string()),
                        }
                    }
                } else {
                    // Ищем Adobe Acrobat в стандартных путях
                    let adobe_paths = [
                        r"C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe",
                        r"C:\Program Files (x86)\Adobe\Acrobat Reader DC\Reader\AcroRd32.exe",
                        r"C:\Program Files (x86)\Adobe\Acrobat DC\Acrobat\Acrobat.exe"
                    ];

                    let mut opened_with = None;
                    for adobe_path in &adobe_paths {
                        if Path::new(adobe_path).exists() {
                            println!("Найден Adobe Acrobat: {}", adobe_path);
                            match Command::new(adobe_path)
                                .arg("/A")
                                .arg(format!("page={}", page_num))
                                .arg(&path)
                                .spawn() {
                                Ok(_) => {
                                    opened_with = Some(adobe_path.to_string());
                                    break;
                                }
                                Err(_) => continue,
                            }
                        }
                    }

                    match opened_with {
                        Some(adobe_path) => (true, adobe_path),
                        None => {
                            // Если ни один Adobe не найден, открываем через explorer
                            match Command::new("explorer").arg(&path).spawn() {
                                Ok(_) => (true, "explorer".to_string()),
                                Err(_) => (false, "explorer".to_string()),
                            }
                        }
                    }
                }
            } else {
                // Не PDF файл с указанной страницей - открываем через explorer
                match Command::new("explorer").arg(&path).spawn() {
                    Ok(_) => (true, "explorer".to_string()),
                    Err(_) => (false, "explorer".to_string()),
                }
            }
        } else {
            // Если страница не указана - обычное открытие через explorer
            match Command::new("explorer").arg(&path).spawn() {
                Ok(_) => (true, "explorer".to_string()),
                Err(_) => (false, "explorer".to_string()),
            }
        };

        Ok(OpenFileResult { success, path: used_path })
    }

    #[cfg(target_os = "macos")]
    {
        match Command::new("open").arg(&path).spawn() {
            Ok(_) => Ok(OpenFileResult { success: true, path: "open".to_string() }),
            Err(e) => Err(format!("Ошибка при открытии файла: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        match Command::new("xdg-open").arg(&path).spawn() {
            Ok(_) => Ok(OpenFileResult { success: true, path: "xdg-open".to_string() }),
            Err(e) => Err(format!("Ошибка при открытии файла: {}", e)),
        }
    }
}

// Не используется
pub fn parse_file_metadata(path: &std::path::Path) -> Option<FileMetadata> {
    if !path.is_file() {
        return None;
    }

    // everything_search(query.as_str());

    if let Some(file_name) = path.file_stem().and_then(|s| s.to_str()) {
        let parts: Vec<&str> = file_name.splitn(4, ' ').collect();
        if parts.len() != 4 {
            return None;
        }

        return Some(FileMetadata {
            file_name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into(),
            full_path: path.to_string_lossy().into(), // Сохраняем полный путь
            title: parts[3].to_string(),
        });
    }
    None
}

#[command]
pub async fn show_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть проводник: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Для Linux используем xdg-open или nautilus
        let parent = Path::new(&path)
            .parent()
            .ok_or("Не удалось получить родительскую директорию")?;

        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Не удалось открыть файловый менеджер: {}", e))?;
    }

    Ok(())
}

// Можно удалить, оно все равно не работает
#[command]
pub async fn open_file_with(path: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    {
        Command::new("rundll32")
            .args(["shell32.dll,OpenAs_RunDLL", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть диалог 'Открыть с помощью': {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-a", "Choose Application", &path])
            .spawn()
            .map_err(|e| format!("Не удалось открыть диалог выбора приложения: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Для Linux можно использовать различные команды в зависимости от DE
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Не удалось открыть файл: {}", e))?;
    }

    Ok(())
}

#[command]
pub fn set_metadata(file_path: String) -> String {
    set_creator(&file_path).unwrap_or_default()
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err("Файл не существует".to_string());
    }

    if file_path.is_file() {
        fs::remove_file(&path).map_err(|e| format!("Не удалось удалить файл: {}", e))?;
    } else if file_path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Не удалось удалить папку: {}", e))?;
    }

    Ok(())
}

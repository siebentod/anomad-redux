// src/commands/directory_watcher.rs
use notify::{Event, EventKind, RecursiveMode, Result as NotifyResult, Watcher};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Emitter, State};
use tokio::sync::mpsc;

// Глобальное состояние для хранения активных watcher'ов
pub type WatcherMap = Arc<Mutex<HashMap<String, notify::RecommendedWatcher>>>;

#[derive(Debug, Serialize, Clone)]
pub struct FileChangeEvent {
    pub event_type: String, // "created", "modified", "deleted"
    pub file_path: String,
    pub metadata: Option<super::file_commands::FileMetadata>, // Используем FileMetadata из другого модуля
}

// Импортируем функцию parse_file_metadata из модуля file_ops
use super::file_commands::parse_file_metadata;

#[command]
pub async fn start_watching_directory(
    app_handle: AppHandle,
    dir_path: String,
    watchers: State<'_, WatcherMap>,
) -> Result<(), String> {
    let path = PathBuf::from(&dir_path);
    if !path.exists() || !path.is_dir() {
        return Err("Указанный путь не существует или не является директорией".into());
    }

    // Создаем канал для получения событий
    let (tx, mut rx) = mpsc::channel(100);

    // Создаем watcher
    let mut watcher = notify::recommended_watcher(move |res: NotifyResult<Event>| {
        if let Ok(event) = res {
            let _ = tx.blocking_send(event);
        }
    })
    .map_err(|e| e.to_string())?;

    // Начинаем отслеживание директории
    watcher
        .watch(&path, RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    // Сохраняем watcher в глобальном состоянии
    {
        let mut watchers_guard = watchers.lock().unwrap();
        // Проверяем, не отслеживается ли уже эта директория
        if watchers_guard.contains_key(&dir_path) {
            return Err(format!("Директория '{}' уже отслеживается.", dir_path));
        }
        watchers_guard.insert(dir_path.clone(), watcher);
    }

    // Создаем задачу для обработки событий
    let app_handle_clone = app_handle.clone();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event.kind {
                EventKind::Create(_) => {
                    for path in event.paths {
                        if let Some(metadata) = parse_file_metadata(&path) {
                            let change_event = FileChangeEvent {
                                event_type: "created".to_string(),
                                file_path: path.to_string_lossy().to_string(),
                                metadata: Some(metadata),
                            };
                            let _ = app_handle_clone.emit("file-changed", &change_event);
                        }
                    }
                }
                EventKind::Modify(_) => {
                    for path in event.paths {
                        if let Some(metadata) = parse_file_metadata(&path) {
                            let change_event = FileChangeEvent {
                                event_type: "modified".to_string(),
                                file_path: path.to_string_lossy().to_string(),
                                metadata: Some(metadata),
                            };
                            let _ = app_handle_clone.emit("file-changed", &change_event);
                        }
                    }
                }
                EventKind::Remove(_) => {
                    for path in event.paths {
                        let change_event = FileChangeEvent {
                            event_type: "deleted".to_string(),
                            file_path: path.to_string_lossy().to_string(),
                            metadata: None,
                        };
                        let _ = app_handle_clone.emit("file-changed", &change_event);
                    }
                }
                _ => {}
            }
        }
    });

    Ok(())
}

#[command]
pub async fn stop_watching_directory(
    dir_path: String,
    watchers: State<'_, WatcherMap>,
) -> Result<(), String> {
    let mut watchers_guard = watchers.lock().unwrap();
    if watchers_guard.remove(&dir_path).is_some() {
        Ok(())
    } else {
        Err("Watcher для данной директории не найден".into())
    }
}

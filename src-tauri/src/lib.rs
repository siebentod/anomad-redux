// src/lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// use tauri::{AppHandle, Manager, State};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

// Объявляем модуль commands, который будет искать src/commands/mod.rs
mod commands;

// Импортируем команды и WatcherMap из нашего нового модуля
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let watchers: WatcherMap = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(watchers)
        .invoke_handler(tauri::generate_handler![
            // Здесь просто указываем имена функций
            get_everything,
            get_everything_with_meta,
            edit_filename,
            open_file,
            delete_file,
            open_file_with,
            show_in_explorer,
            set_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

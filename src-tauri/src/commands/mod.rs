// модуль, который связывает и реэкспортирует команды и типы

pub mod file_commands;
pub mod watcher_commands;

pub use file_commands::*;
pub use watcher_commands::*;

mod utils;

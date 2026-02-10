use anyhow::Context;
use fs2::FileExt;
use std::fs::OpenOptions;
use std::path::Path;
use xmp_toolkit::{xmp_ns, OpenFileOptions, XmpFile, XmpMeta};

use super::file_info::FileInfo;

pub fn get_file_info_all_meta(path_str: &str) -> FileInfo {
    let path = Path::new(path_str);

    let is_locked = match std::panic::catch_unwind(|| {
        if let Ok(file) = OpenOptions::new().write(true).open(path) {
            file.try_lock_exclusive().is_err()
        } else {
            true
        }
    }) {
        Ok(result) => result,
        Err(_) => false,
    };

    let file_index = file_id::get_low_res_file_id(path).ok().and_then(|id| {
        if let file_id::FileId::LowRes { file_index, .. } = id {
            Some(file_index.to_string())
        } else {
            None
        }
    });

    let file_id = match file_index {
        Some(index) => Some(index),
        None => None,
    };

    // Получаем PDF метаданные только для PDF файлов
    let (pdf_title, pdf_author, pdf_creator) = if path_str.to_lowercase().ends_with(".pdf") {
        match get_pdf_metadata_xmp(path_str) {
            Ok((title, author, creator)) => (title, author, creator),
            Err(_) => (None, None, None),
        }
    } else {
        (None, None, None)
    };

    FileInfo {
        is_locked,
        file_id,
        pdf_title,
        pdf_author,
        pdf_creator,
    }
}

fn get_pdf_metadata_xmp(
    path_str: &str,
) -> anyhow::Result<(Option<String>, Option<String>, Option<String>)> {
    let mut xmp_file = XmpFile::new()?;

    // Пытаемся открыть файл с помощью смарт-обработчика
    if xmp_file
        .open_file(
            path_str,
            OpenFileOptions::default().only_xmp().use_smart_handler(),
        )
        .is_err()
    {
        // Если не получилось, пробуем сканирование пакетов
        xmp_file
            .open_file(path_str, OpenFileOptions::default().use_packet_scanning())
            .with_context(|| format!("Failed to open file {} for XMP reading", path_str))?;
    }

    let xmp_meta = xmp_file
        .xmp()
        .ok_or_else(|| anyhow::anyhow!("No XMP metadata found in file {}", path_str))?;

    let title = xmp_meta
        .property_array(xmp_ns::DC, "title")
        .next()
        .map(|p| p.value.to_string());

    let author = xmp_meta
        .property_array(xmp_ns::DC, "creator")
        .next()
        .map(|p| p.value.to_string());

    let creator = xmp_meta
        .property(xmp_ns::XMP, "CreatorTool")
        .map(|p| p.value.to_string());

    Ok((title, author, creator))
}

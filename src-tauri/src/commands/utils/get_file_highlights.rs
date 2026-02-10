use anyhow::{Context, Result};
use lopdf::{Document, Object};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Highlight {
    pub page: u32,
    pub highlighted_text: String,
    pub annotation_text: Option<String>,
    pub date: Option<String>,
    pub highlight_type: String,
    pub color: Option<Vec<f32>>, // RGB или CMYK значения (0.0 - 1.0)
}

pub fn get_file_highlights(path_str: &str) -> Result<Vec<Highlight>> {
    let path = Path::new(path_str);

    let doc = Document::load(path).context("Failed to load PDF file")?;

    let mut highlights = Vec::new();

    for (page_num, page_id) in doc.get_pages() {
        let page_dict = doc
            .get_dictionary(page_id)
            .context("Failed to get page dictionary")?;

        if let Ok(annots_obj) = page_dict.get(b"Annots") {
            let annots_list = match annots_obj {
                Object::Array(list) => list.clone(),
                Object::Reference(id) => doc
                    .get_object(*id)
                    .and_then(|o| o.as_array())
                    .cloned()
                    .context("Failed to resolve Annots reference")?,
                _ => continue,
            };

            for annot_obj in annots_list {
                let annot_dict = match annot_obj {
                    Object::Reference(id) => doc.get_dictionary(id).ok().cloned(),
                    Object::Dictionary(dict) => Some(dict),
                    _ => None,
                };

                if let Some(dict) = annot_dict {
                    // Проверяем Subtype аннотации
                    let subtype = dict
                        .get(b"Subtype")
                        .and_then(|o| o.as_name_str())
                        .unwrap_or("");

                    // Принимаем Highlight, Text (обычные комментарии/sticky notes) и FreeText
                    let is_supported = matches!(subtype, "Highlight" | "Text" | "FreeText");

                    if !is_supported {
                        continue;
                    }

                    // Извлекаем текст аннотации из поля Contents
                    let annotation_text = dict
                        .get(b"Contents")
                        .ok()
                        .and_then(|obj| decode_pdf_string(obj))
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty());

                    // Извлекаем дату модификации
                    let date = dict
                        .get(b"M")
                        .ok()
                        .and_then(|obj| decode_pdf_string(obj))
                        .filter(|s| !s.is_empty());

                    // Извлекаем цвет аннотации
                    let color = extract_color(&dict);

                    // Определяем тип и добавляем highlight
                    let (highlight_type, highlighted_text) = if annotation_text.is_some() {
                        ("annotation".to_string(), String::new())
                    } else {
                        ("highlight".to_string(), String::new())
                    };

                    highlights.push(Highlight {
                        page: page_num,
                        highlighted_text,
                        annotation_text,
                        date,
                        highlight_type,
                        color,
                    });
                }
            }
        }
    }

    Ok(highlights)
}

fn extract_color(dict: &lopdf::Dictionary) -> Option<Vec<f32>> {
    // Цвет может быть в поле "C" (Color) аннотации
    dict.get(b"C")
        .ok()
        .and_then(|obj| match obj {
            Object::Array(arr) => {
                let colors: Option<Vec<f32>> = arr
                    .iter()
                    .map(|o| match o {
                        Object::Real(f) => Some(*f as f32),
                        Object::Integer(i) => Some(*i as f32),
                        _ => None,
                    })
                    .collect();
                colors
            }
            _ => None,
        })
        .filter(|v| !v.is_empty())
}

fn decode_pdf_string(obj: &Object) -> Option<String> {
    let bytes = match obj {
        Object::String(bytes, _) => bytes,
        _ => return None,
    };

    if bytes.len() >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF {
        let u16_vec: Vec<u16> = bytes[2..]
            .chunks_exact(2)
            .map(|chunk| u16::from_be_bytes([chunk[0], chunk[1]]))
            .collect();
        return String::from_utf16(&u16_vec).ok();
    }

    if bytes.len() >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF {
        return String::from_utf8(bytes[3..].to_vec()).ok();
    }

    if let Ok(s) = String::from_utf8(bytes.clone()) {
        return Some(s);
    }

    let s: String = bytes.iter().map(|&b| b as char).collect();

    Some(s)
}

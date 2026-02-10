use anyhow::{Context, Result};
use rand::{distributions::Alphanumeric, Rng};
use std::path::Path;
use xmp_toolkit::{xmp_ns::XMP, OpenFileOptions, XmpFile, XmpMeta, XmpValue};

pub fn set_creator(file_path: &str) -> Result<String> {
    let path = Path::new(file_path);
    let mut xmp_file = XmpFile::new()?;

    // First try to open with smart handler for update
    let open_result = xmp_file.open_file(
        path,
        OpenFileOptions::default()
            .only_xmp()
            .use_smart_handler()
            .for_update(),
    );

    // If that fails, try packet scanning for update
    if open_result.is_err() {
        xmp_file
            .open_file(
                path,
                OpenFileOptions::default()
                    .use_packet_scanning()
                    .for_update(),
            )
            .with_context(|| format!("Failed to open file {} for XMP writing", file_path))?;
    }

    // Get or create metadata
    let mut xmp_meta = match xmp_file.xmp() {
        Some(meta) => meta,
        None => XmpMeta::new()?,
    };

    // Check current CreatorTool value
    let current_creator = xmp_meta
        .property(XMP, "CreatorTool")
        .map(|p| p.value.to_string())
        .unwrap_or_default();

    let new_creator = if current_creator.starts_with("id_") {
        current_creator
    } else {
        println!("Creating new ID in file metadata");
        // Generate random ID (12 characters)
        let id: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(12)
            .map(char::from)
            .collect();

        let new_id = format!("id_{}", id);

        // Set new value
        xmp_meta.set_property(XMP, "CreatorTool", &XmpValue::from(new_id.clone()))?;

        new_id
    };

    // Save changes
    xmp_file.put_xmp(&xmp_meta)?;
    xmp_file.close();

    Ok(new_creator)
}

#[derive(Debug)]
pub struct FileInfo {
    pub is_locked: bool,
    pub file_id: Option<String>,
    pub pdf_title: Option<String>,
    pub pdf_author: Option<String>,
    pub pdf_creator: Option<String>,
}

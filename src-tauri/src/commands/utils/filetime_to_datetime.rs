use chrono::{DateTime, TimeZone, Utc};

pub fn filetime_to_datetime(filetime: u64) -> String {
    const WINDOWS_TO_UNIX_EPOCH_SECS: i64 = 11_644_473_600;

    let seconds = (filetime / 10_000_000) as i64;
    let nanos = ((filetime % 10_000_000) * 100) as u32;

    let unix_secs = match seconds.checked_sub(WINDOWS_TO_UNIX_EPOCH_SECS) {
        Some(secs) => secs,
        None => return String::new(),
    };

    match Utc.timestamp_opt(unix_secs, nanos).single() {
        Some(dt) => dt.to_rfc3339(),
        None => String::new(),
    }
}
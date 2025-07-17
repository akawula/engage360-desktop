// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::Menu;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // Disable default menu to prevent keyboard shortcut interception
            #[cfg(target_os = "macos")]
            {
                let menu = Menu::new(app)?;
                app.set_menu(menu)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

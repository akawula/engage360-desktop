// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent, Emitter};
use tauri_plugin_notification::NotificationExt;
use std::time::Duration;
use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_background_task_status() -> String {
    // This could return actual status from a shared state
    "Background task is running".to_string()
}

#[tauri::command]
fn trigger_background_task() -> String {
    // This could trigger an immediate background task
    println!("Manual background task triggered");
    "Background task triggered manually".to_string()
}

#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn notify_due_action_item(app: tauri::AppHandle, title: String, due_date: String) -> Result<(), String> {
    let notification_title = "Action Item Due";
    let notification_body = format!("\"{}\" is due {}", title, due_date);

    app.notification()
        .builder()
        .title(notification_title)
        .body(&notification_body)
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn clear_due_item_notifications(app: tauri::AppHandle) -> Result<String, String> {
    // Emit event to frontend to clear notifications
    app.emit("clear-due-item-notifications", ())
        .map_err(|e| e.to_string())?;

    Ok("Notification clear request sent to frontend".to_string())
}

#[tauri::command]
fn run_command(command: String, args: Vec<String>) -> Result<serde_json::Value, String> {
    let output = Command::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute command '{}': {}", command, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(serde_json::json!({
        "success": output.status.success(),
        "stdout": stdout,
        "stderr": stderr
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, get_background_task_status, trigger_background_task, send_notification, notify_due_action_item, clear_due_item_notifications, run_command])
        .setup(|app| {
            // Create proper menu with standard shortcuts for macOS
            #[cfg(target_os = "macos")]
            {
                let app_submenu = Submenu::with_items(app, "Engage360", true, &[
                    &PredefinedMenuItem::about(app, Some("About Engage360"), None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::services(app, Some("Services"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::hide(app, Some("Hide Engage360"))?,
                    &PredefinedMenuItem::hide_others(app, Some("Hide Others"))?,
                    &PredefinedMenuItem::show_all(app, Some("Show All"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, Some("Quit Engage360"))?,
                ])?;

                let edit_submenu = Submenu::with_items(app, "Edit", true, &[
                    &PredefinedMenuItem::undo(app, Some("Undo"))?,
                    &PredefinedMenuItem::redo(app, Some("Redo"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::cut(app, Some("Cut"))?,
                    &PredefinedMenuItem::copy(app, Some("Copy"))?,
                    &PredefinedMenuItem::paste(app, Some("Paste"))?,
                    &PredefinedMenuItem::select_all(app, Some("Select All"))?,
                ])?;

                let window_submenu = Submenu::with_items(app, "Window", true, &[
                    &PredefinedMenuItem::minimize(app, Some("Minimize"))?,
                    &PredefinedMenuItem::maximize(app, Some("Maximize"))?,
                    &PredefinedMenuItem::close_window(app, Some("Close Window"))?,
                ])?;

                let menu = Menu::with_items(app, &[&app_submenu, &edit_submenu, &window_submenu])?;
                app.set_menu(menu)?;
            }

            // Create tray menu items
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Create tray menu
            let tray_menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .icon(app.default_window_icon().unwrap().clone())
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        _ => {}
                    }
                })
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Set activation policy for macOS to hide dock icon
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Start background task
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(Duration::from_secs(60)); // Run every 60 seconds for testing

                loop {
                    interval.tick().await;

                    // Example background task - you can replace this with your actual logic
                    println!("Background task running...");

                    // Check for due action items by requesting the frontend to do the check
                    match app_handle.emit("check-due-action-items", ()) {
                        Ok(_) => {
                            println!("Requested due action items check from frontend");
                        }
                        Err(e) => {
                            eprintln!("Failed to request due action items check: {}", e);
                        }
                    }

                    // You can emit events to the frontend
                    if let Err(e) = app_handle.emit("background-task-completed", "Task completed successfully") {
                        eprintln!("Failed to emit event: {}", e);
                    }

                    // You can also update the tray icon or tooltip based on task status
                    // Example: Change tray icon color or show notifications
                }
            });            // Handle window close event to hide instead of quit
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

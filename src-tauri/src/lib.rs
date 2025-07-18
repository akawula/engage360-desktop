// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent, Emitter};
use tauri_plugin_notification::NotificationExt;
use std::time::Duration;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, get_background_task_status, trigger_background_task, send_notification, notify_due_action_item, clear_due_item_notifications])
        .setup(|app| {
            // Disable default menu to prevent keyboard shortcut interception
            #[cfg(target_os = "macos")]
            {
                let menu = Menu::new(app)?;
                app.set_menu(menu)?;
            }

            // Create tray menu items
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let status_item = MenuItem::with_id(app, "status", "Background Task Status", true, None::<&str>)?;
            let trigger_item = MenuItem::with_id(app, "trigger", "Trigger Background Task", true, None::<&str>)?;
            let clear_notifications_item = MenuItem::with_id(app, "clear-notifications", "Clear Due Item Notifications", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Create tray menu
            let tray_menu = Menu::with_items(app, &[&show_item, &hide_item, &status_item, &trigger_item, &clear_notifications_item, &quit_item])?;            // Create tray icon
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
                        "status" => {
                            println!("Background task status: Running");
                            // Show notification with status
                            if let Err(e) = app.notification()
                                .builder()
                                .title("Background Task Status")
                                .body("Background task is running and healthy!")
                                .show() {
                                eprintln!("Failed to send notification: {}", e);
                            }
                        }
                        "trigger" => {
                            println!("Manual background task triggered from tray menu");
                            // Trigger an immediate background task
                            let app_handle = app.clone();
                            tauri::async_runtime::spawn(async move {
                                println!("Executing manual background task...");

                                // Send a notification about the manual task
                                if let Err(e) = app_handle.notification()
                                    .builder()
                                    .title("Manual Task")
                                    .body("Manual background task executed from tray menu!")
                                    .show() {
                                    eprintln!("Failed to send notification: {}", e);
                                }

                                // Add your task logic here
                                if let Err(e) = app_handle.emit("manual-task-completed", "Manual task completed") {
                                    eprintln!("Failed to emit event: {}", e);
                                }
                            });
                        }
                        "clear-notifications" => {
                            println!("Clearing due item notifications from tray menu");
                            // Clear due item notifications
                            if let Err(e) = app.emit("clear-due-item-notifications", ()) {
                                eprintln!("Failed to emit clear notifications event: {}", e);
                            } else {
                                // Show confirmation notification
                                if let Err(e) = app.notification()
                                    .builder()
                                    .title("Notifications Cleared")
                                    .body("Due action item notifications have been cleared")
                                    .show() {
                                    eprintln!("Failed to send confirmation notification: {}", e);
                                }
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

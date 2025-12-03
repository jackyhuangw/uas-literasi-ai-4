# UAS Literasi Project

## How to Run

Since this is a static HTML/CSS/JS project, you have a few options to run it:

### Option 1: Open directly in Browser
You can simply double-click the `index.html` file (or `dashboard-viewer.html` / `dashboard-admin.html`) in your file explorer to open it in your default web browser.

### Option 2: VS Code Live Server (Recommended)
If you are using VS Code:
1.  Install the "Live Server" extension.
2.  Right-click on `index.html`.
3.  Select "Open with Live Server".
This will automatically reload the page when you save changes.

### Option 3: Python Simple HTTP Server
If you have Python installed, you can run a local server from the terminal:

```bash
# Run this command in the project root directory
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

## Project Structure
- `index.html`: Main entry point (currently empty)
- `dashboard-viewer.html`: Dashboard for viewers
- `dashboard-admin.html`: Dashboard for admins
- `css/`: Stylesheets
- `js/`: JavaScript files

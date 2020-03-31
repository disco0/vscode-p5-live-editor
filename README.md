# p5-live-editor

This extension let you code your p5js projects live in Visual Studio Code. There are other plugins that le you do the same but all have some troubles, so I decided to "merge" them in order to create a more useful editor for my classroom lessons.

![Example Screenshot](images/example_01.png)

In order to use the plugin you must have a sketch.js and a index.html file in your project folder. You can also use multiple .js files, the plugin will manage them automatically.

![P5 live Editor Sidebar](images/sidebar.png)

after clickgin on the sidebar icon, you can add a new project directly from the upper plus sign.

![P5 live Editor - Add new project](images/treeview_add.png)

If the current folder contains an index.html and a sketch.js, you can open the preview by clicking on the button in the status bar.

![P5 live Editor - Open Preview](images/presentazione-p5-live-editor.jpg)

## Project Management

Starting from 0.2.0 version you can scaffold a new project directly from the p5 live editor sidebar. You can find it in the sidebar

[![VIDEO GUIDE](images/presentazione-p5-live-editor.jpg)](https://youtu.be/y-4vhQOSbwY "Video Youtube")

## Features

- Start as simple as a single sketch.js file
- include multiple files simply creating them in the repository folder
- JSHint integration to find errors
- Fully ES 6 compatible

## Usage

If a JavaScript file is open, a p5-live-editor button appears in the status bar bottom left. Click on it, to open the preview.

## Known Issues

There are currently no known issues. If you find any issues, please feel free, to fill an issue on github [Github](https://github.com/ProfAndreaPollini/vscode-p5-live-editor/issues).

## Release Notes

## 0.3.1

### Fixed

- Fixed bug in opening condition

### 0.3.0

#### Changed

- Now you can open the p5 live editor preview clicking on the p5-livee-editor button in the status bar.

#### Fixed

- Now You can open the preview panel only if in the current files there are a index.html and a sketch.js file.

### 0.2.0

- added project management

### 0.1.1

- Fixed some typo

### 0.1.0

- First release

## License

This Library is licensed under the MIT License. Please refer to the `LICENSE.txt` for more information.

## Plugin I've taken code from

I try to merge the feature of two great plugins: https://github.com/filipesabella/vscode-live-p5 and many of the code is taken from https://github.com/pixelkind/p5canvas (I forked this repo)
Icons from: https://github.com/tabler/tabler-icons

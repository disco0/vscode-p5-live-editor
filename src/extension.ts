"use strict";

import * as vscode from "vscode";
import { WebSocketServer, ImageType } from "./WebSocketServer";
import { JSHINT } from "jshint";
import { JSDOM } from "jsdom";
import * as path from "path";
import * as fs from "fs";
import * as parser from "./code-parser";
import { P5ProjectsProvider } from "./P5ProjectsNodeProvider";
import { createNewP5Project, DeleteP5Project } from "./filePath";
import { P5Project } from "./P5Project";
import { configWebSocketServer } from "./Websocket";
import { OnDidChangeTextDocument } from "./events/OnDidChangeTextDocument";
import { OnDidChangeActiveTextEditor } from "./events/OnDidChangeActiveTextEditor";

var websocket: WebSocketServer;
var counter: number = 0;
let server: string = "";
let currentPanel: vscode.WebviewPanel | undefined = undefined;
let selectedProject: P5Project | undefined = undefined;

const createStatusBarItem = () => {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = `$(file-media) p5-live-editor`;
  statusBarItem.command = "extension.showP5LiveEditorCanvas";
  return statusBarItem;
};

const initTreeView = () => {
  //console.log("initTreeView()");
  const p5ProjectsProvider = new P5ProjectsProvider(vscode.workspace.rootPath);
  vscode.window.registerTreeDataProvider(
    "p5-projects-view",
    p5ProjectsProvider
  );
};
export function activate(context: vscode.ExtensionContext) {
  //console.log("activate(", context, ")");
  const p5ProjectsProvider = new P5ProjectsProvider(vscode.workspace.rootPath);
  vscode.window.registerTreeDataProvider(
    "p5-projects-view",
    p5ProjectsProvider
  );

  vscode.commands.registerCommand("extension.refreshEntry", () => {
    p5ProjectsProvider.refresh();
    //console.log("refresh");
  });

  vscode.commands.registerCommand(
    "extension.selectProject",
    (project: P5Project) => {
      selectedProject = project;
      statusBarItem.text = `p5-live-editor: ${selectedProject.name}`;
    }
  );

  let statusBarItem = createStatusBarItem();
  statusBarItem.show();

  let outputChannel = vscode.window.createOutputChannel(
    "p5-live-editor Console"
  );

  vscode.commands.registerCommand("extension.deleteProject", evt => {
    vscode.window.showInformationMessage("DELETE");
    //console.log("DELETE", evt);
    DeleteP5Project(evt);
  });

  let lastKnownEditor = vscode.window.activeTextEditor;
  websocket = configWebSocketServer(outputChannel, lastKnownEditor)(
    server,
    updateCode
  );

  let changeTextDocument = OnDidChangeTextDocument(() => {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      lastKnownEditor = editor;
      updateCode(lastKnownEditor, websocket, outputChannel);
    }
  }); /*vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      if (
        e &&
        e.document &&
        vscode.window.activeTextEditor != undefined &&
        e.document === vscode.window.activeTextEditor.document &&
        e.document.languageId == "javascript"
      ) {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
          lastKnownEditor = editor;
          updateCode(lastKnownEditor, websocket, outputChannel);
        }
      }
    }
  );*/

  let didChangeActiveEditor = OnDidChangeActiveTextEditor(e => {
    if (e && e.document && e.document.languageId == "javascript") {
      statusBarItem.show();
      let editor = vscode.window.activeTextEditor;
      if (editor) {
        lastKnownEditor = editor;
        updateCode(lastKnownEditor, websocket, outputChannel);
      }
    } else {
      statusBarItem.hide();
    }
    localPath = vscode.Uri.file(
      path.dirname(vscode.window.activeTextEditor.document.uri.path)
    );

    let disposable = vscode.commands.registerCommand(
      "extension.showP5LiveEditorCanvas",
      () => {
        if (currentPanel) {
          currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
          currentPanel = vscode.window.createWebviewPanel(
            "p5-live-editor",
            "p5-live-editor",
            vscode.ViewColumn.Two,
            {
              enableScripts: true,
              localResourceRoots: [extensionPath, localPath]
            }
          );
          currentPanel.webview.html = getWebviewContent();
          currentPanel.onDidDispose(
            () => {
              currentPanel = undefined;
            },
            undefined,
            context.subscriptions
          );
        }
      }
    );
    context.subscriptions.push(disposable);
  });

  let extensionPath = vscode.Uri.file(
    vscode.extensions.getExtension("andreapollini.p5-live-editor").extensionPath
  );
  //console.log("EXT PATH = ", extensionPath);
  let folderPath = vscode.workspace.rootPath;

  let localPath = undefined;
  let disposable = undefined;
  if (vscode.window.activeTextEditor) {
    localPath = vscode.Uri.file(
      path.dirname(vscode.window.activeTextEditor.document.uri.path)
    );

    let disposable = vscode.commands.registerCommand(
      "extension.showP5LiveEditorCanvas",
      () => {
        if (currentPanel) {
          currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
          currentPanel = vscode.window.createWebviewPanel(
            "p5-live-editor",
            "p5-live-editor",
            vscode.ViewColumn.Two,
            {
              enableScripts: true,
              localResourceRoots: [extensionPath, localPath]
            }
          );
          currentPanel.webview.html = getWebviewContent();
          currentPanel.onDidDispose(
            () => {
              currentPanel = undefined;
            },
            undefined,
            context.subscriptions
          );
        }
      }
    );
    context.subscriptions.push(disposable);
  }
  /*
  let disposableSaveAsPNG = vscode.commands.registerCommand(
    "extension.saveAsPNG",
    () => {
      websocket.sendImageRequest(ImageType.png);
    }
  );
*/

  let createP5Project = vscode.commands.registerCommand(
    "extension.createp5project",
    () => {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: "Open"
      };
      vscode.window.showWarningMessage("CREATE NEW PROJECT");
      vscode.window.showOpenDialog(options).then(fileUri => {
        if (fileUri && fileUri[0]) {
          //console.log("Selected file: " + fileUri[0].fsPath);
          const projectNameInputOptions: vscode.InputBoxOptions = {
            prompt: "New P5 project name",
            password: false
          };
          const projectFolder = fileUri[0].fsPath;
          vscode.window
            .showInputBox(projectNameInputOptions)
            .then(projectName => {
              if (projectName) {
                vscode.window.showInformationMessage(
                  "Creating project: " + projectName
                );
              }
              createNewP5Project(projectName, projectFolder);
            });
        }
      });
    }
  );

  context.subscriptions.push(
    //disposable,
    statusBarItem,
    //  disposableSaveAsPNG,
    changeTextDocument,
    didChangeActiveEditor,
    outputChannel,
    createP5Project
  );
}

function updateCode(editor, websocket, outputChannel) {
  if (!editor) {
    console.log("Error: No document found");
    return;
  }
  if (editor.document.languageId !== "javascript") {
    outputChannel.clear();
    currentPanel.webview.html = getWebviewContent(editor.document.getText());
    return;
  }
  let text = editor.document.getText();
  let options = {
    esversion: 6
  };
  JSHINT(text, options);

  if (JSHINT.errors.length == 0) {
    outputChannel.clear();
    currentPanel.webview.html = getWebviewContent(text);
  } else {
    let message = "🛑 Errors:\n";

    let es6error = false;
    JSHINT.errors.forEach(element => {
      message += `Line ${element.line}, col ${element.character}: ${element.reason}\n`;
    });
    outputChannel.clear();
    outputChannel.append(message);
  }
}

function getWebviewContent(code: String = "") {
  if (!vscode.window.activeTextEditor) return;
  let extensionPath = vscode.Uri.file(
    vscode.extensions.getExtension("andreapollini.p5-live-editor").extensionPath
  ).with({
    scheme: "vscode-resource"
  });

  let localPath = vscode.Uri.file(
    path.dirname(vscode.window.activeTextEditor.document.uri.path) + path.sep
  ).with({
    scheme: "vscode-resource"
  }).fsPath;
  let ParsedCode = "";
  let extenalJSCodeParsed = "";
  if (localPath) {
    const sketchCode = fs.readFileSync(
      localPath + path.sep + "sketch.js",
      "utf8"
    );

    //console.log("SKETCH CONTENT = ", sketchCode);

    ParsedCode = parser.parseCode(sketchCode);
    //console.log("PARSED CODE:", ParsedCode);
    extenalJSCodeParsed = fs
      .readdirSync(localPath)
      .filter(filename => filename.split(".").pop() === "js")
      .filter(filename => filename !== "sketch.js")
      .map(f => fs.readFileSync(localPath + path.sep + f, "utf8"))
      .reduce((program, code) => program + "\n" + code, "");
  }

  const indexHTMLTemplateFilePath =
    vscode.extensions.getExtension("andreapollini.p5-live-editor")
      .extensionPath +
    path.sep +
    "assets" +
    path.sep +
    "index.html";
  const dom = new JSDOM(fs.readFileSync(`${localPath + path.sep}index.html`));

  const baseDOM = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <head>
     
      <script src="${extensionPath}/assets/websocketlog.js"></script>
     
     
    
      <style>
      html {
          height: 100%;
      }
      body {
          height: 100%;
          display: flex;
          flex-direction: row;
          padding: 0;
          margin: 0;
      }
      .no-padding-no-margin {
          padding: 0;
          margin: 0;
      }
      .flex-col {
          flex-direction: column;
      }
     
      canvas {
          display: block;
      }
    </style>
    </head>
    <body >
      <div id="p5canvas"></div>
      <script>setupWebsocket("${server}");</script>
      <script src="${extensionPath}/assets/p5setup.js"></script>
      <script>
      ${extenalJSCodeParsed}
      </script>
      <script id="code">
        var draw;
        var preload;
        var setup;
        var ext;
        var keyPressed, keyReleased, keyTyped;
        var mousePressed, mouseReleased, mouseClicked, doubleClicked;
        var mouseDragged, mouseMoved, mouseWheel;
        var touchesStarted, touchesMoved, touchesEnded;
        ${ParsedCode}

        window.preload = preload;
        window.draw = draw;
        window.keyPressed = keyPressed;
        window.keyReleased = keyReleased;
        window.keyTyped = keyTyped;
        window.mousePressed = mousePressed;
        window.mouseReleased = mouseReleased;
        window.mouseClicked = mouseClicked;
        window.doubleClicked = doubleClicked;
        window.mouseDragged = mouseDragged;
        window.mouseMoved = mouseMoved;
        window.mouseWheel = mouseWheel;
        window.touchesStarted = touchesStarted;
        window.touchesMoved = touchesMoved;
        window.touchesEnded = touchesEnded;

       
      </script>
      
    </body>
  </html>
  `);
  //console.log("HTML -> ", baseDOM.window.document.documentElement.outerHTML);

  const baseDocument = baseDOM.window.document;
  const domDocument = dom.window.document;

  domDocument.querySelectorAll("head > script").forEach(element => {
    //console.log("el -> ", element.src);
    if (element.src.endsWith("sketch.js")) {
      element.remove();
      //console.log("remove.");
    }
  });

  domDocument.querySelectorAll("body > script").forEach(element => {
    //console.log("el -> ", element.src);
    if (element.src.endsWith("sketch.js")) {
      element.remove();
      //console.log("remove.");
    }
  });

  baseDocument.querySelector("head").innerHTML += domDocument.querySelector(
    "head"
  ).outerHTML;

  return baseDOM.window.document.documentElement.outerHTML;
}

export function deactivate() {
  websocket.dispose();
  websocket = null;
  return undefined;
}

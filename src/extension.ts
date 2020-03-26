"use strict";

import * as vscode from "vscode";
import { WebSocketServer, ImageType } from "./WebSocketServer";
import { JSHINT } from "jshint";
import * as path from "path";
import * as fs from "fs";
import * as parser from "./code-parser";

var websocket: WebSocketServer;
var counter: number = 0;
let server: string = "";
let currentPanel: vscode.WebviewPanel | undefined = undefined;

const createStatusBarItem = () => {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = `$(file-media) p5-live-editor`;
  statusBarItem.command = "extension.showP5LiveEditorCanvas";
  return statusBarItem;
};

const createWebSocketServer = (outputChannel, lastKnownEditor) => {
  let ws = new WebSocketServer(outputChannel);
  ws.onListening = () => {
    server = websocket.url;
  };
  ws.onConnection = () => {
    outputChannel.show(true);
    if (lastKnownEditor && lastKnownEditor.document) {
      updateCode(lastKnownEditor, websocket, outputChannel);
    }
  };
  return ws;
};

export function activate(context: vscode.ExtensionContext) {
  let statusBarItem = createStatusBarItem();
  statusBarItem.show();

  let outputChannel = vscode.window.createOutputChannel(
    "p5-live-editor Console"
  );

  let lastKnownEditor = vscode.window.activeTextEditor;
  websocket = /*new WebSocketServer(outputChannel);*/ createWebSocketServer(
    outputChannel,
    lastKnownEditor
  );
  /*websocket.onListening = () => {
    server = websocket.url;
  };

  websocket.onConnection = () => {
    outputChannel.show(true);
    if (lastKnownEditor && lastKnownEditor.document) {
      updateCode(lastKnownEditor, websocket, outputChannel);
    }
  };
*/
  let changeTextDocument = vscode.workspace.onDidChangeTextDocument(
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
  );

  let didChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(
    (e: vscode.TextEditor) => {
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
    }
  );

  let extensionPath = vscode.Uri.file(
    vscode.extensions.getExtension("andreapollini.p5-live-editor").extensionPath
  );

  let folderPath = vscode.workspace.rootPath;
  /*console.log(
    "WORKING PATH: " + path.basename(lastKnownEditor.document.uri.fsPath)
  );
  console.log(
    vscode.workspace.getWorkspaceFolder(lastKnownEditor.document.uri)
  );*/

  let localPath = vscode.Uri.file(
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
  /*
  let disposableSaveAsPNG = vscode.commands.registerCommand(
    "extension.saveAsPNG",
    () => {
      websocket.sendImageRequest(ImageType.png);
    }
  );
*/
  context.subscriptions.push(
    disposable,
    statusBarItem,
    //  disposableSaveAsPNG,
    changeTextDocument,
    didChangeActiveEditor,
    outputChannel
  );
}

function updateCode(editor, websocket, outputChannel) {
  if (!editor) {
    console.log("Error: No document found");
    return;
  }
  console.log("editor.document = ", editor.document);
  let text = editor.document.getText();
  let options = {
    esversion: 6
  };
  JSHINT(text, options);

  if (JSHINT.errors.length == 0) {
    outputChannel.clear();
    currentPanel.webview.html = getWebviewContent(text);
  } else {
    let message = "🙊 Errors:\n";

    let es6error = false;
    JSHINT.errors.forEach(element => {
      message += `Line ${element.line}, col ${element.character}: ${element.reason}\n`;
    });
    outputChannel.clear();
    outputChannel.append(message);
  }
  outputChannel.append("ciao");
}

function getWebviewContent_(code: String = ""): string {
  return "CIAO";
}

function getWebviewContent(code: String = "") {
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
    console.log("LOCAL PATH = ", localPath);
    console.log("FILES IN THIS FOLDER: ", fs.readdirSync(localPath));

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
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <script src="${extensionPath}/assets/p5.min.js"></script>
     
      
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
  `;
}

export function deactivate() {
  websocket.dispose();
  websocket = null;
  return undefined;
}

"use strict";

import * as vscode from "vscode";
import { WebSocketServer, ImageType } from "./WebSocketServer";
import { JSHINT } from "jshint";
import { JSDOM } from "jsdom";
import * as path from "path";
import fetch from "node-fetch";
import * as fs from "fs";
import * as parser from "./code-parser";
import { P5ProjectsProvider } from "./P5ProjectsNodeProvider";
import { createNewP5Project, DeleteP5Project } from "./filePath";
import { P5Project } from "./P5Project";
import { configWebSocketServer } from "./Websocket";
import { OnDidChangeTextDocument } from "./events/OnDidChangeTextDocument";
import { OnDidChangeActiveTextEditor } from "./events/OnDidChangeActiveTextEditor";
import { CLIENT_RENEG_LIMIT } from "tls";

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

export function activate(context: vscode.ExtensionContext) {
  ////console.log("activate(", context, ")");
  /* const p5ProjectsProvider = new P5ProjectsProvider(vscode.workspace.rootPath);
  vscode.window.registerTreeDataProvider(
    "p5-projects-view",
    p5ProjectsProvider
  );
  

  vscode.commands.registerCommand(
    "extension.reveal",
    async (project: P5Project) => {
      ////console.log("cmd: extension.reveal -> ", project);
      //await view.reveal(project, { focus: true, select: true, expand: true });
      ////console.log("refresh");
    }
  );

  vscode.commands.registerCommand("extension.refreshEntry", () => {
    p5ProjectsProvider.refresh();

    ////console.log("refresh");
  });

  vscode.commands.registerCommand(
    "extension.selectProject",
    async (project: P5Project) => {
      //console.log("CMD: extension.selectProject", project);
      selectedProject = project;
      statusBarItem.text = `p5-live-editor`;
      statusBarItem.tooltip = "Open Preview";
      let uri = vscode.Uri.file(project.projectPath);
      await vscode.commands.executeCommand("vscode.openFolder", uri);
    }
  );*/

  let statusBarItem = createStatusBarItem();
  statusBarItem.show();

  let outputChannel = vscode.window.createOutputChannel(
    "p5-live-editor Console"
  );

  vscode.commands.registerCommand("extension.deleteProject", (evt) => {
    vscode.window.showInformationMessage("DELETE");
    ////console.log("DELETE", evt);
    DeleteP5Project(evt);
  });

  let lastKnownEditor = vscode.window.activeTextEditor;
  const websocket: WebSocketServer = new WebSocketServer(outputChannel);
  websocket.onListening = () => {
    server = websocket.url;
  };
  websocket.onConnection = () => {
    outputChannel.show(true);
    if (lastKnownEditor && lastKnownEditor.document) {
      updateCode(lastKnownEditor, websocket, outputChannel);
    }
  };

  let changeTextDocument = OnDidChangeTextDocument(() => {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      lastKnownEditor = editor;
      updateCode(lastKnownEditor, websocket, outputChannel);
    }
  });

  /*if (lastKnownEditor) {
   
    p5ProjectsProvider.RevealIfIsProject(lastKnownEditor.document.uri);
  }*/

  let didChangeActiveEditor = OnDidChangeActiveTextEditor(
    (e: vscode.TextEditor) => {
      if (e && e.document && e.document.languageId == "javascript") {
        statusBarItem.show();
        //console.log("EDITOR -> ", e.document.uri, e.document);
        //p5ProjectsProvider.RevealIfIsProject(e.document.uri);

        let editor = vscode.window.activeTextEditor;
        if (editor) {
          lastKnownEditor = editor;
          updateCode(lastKnownEditor, websocket, outputChannel);
        }

        localPath = vscode.Uri.file(path.dirname(e.document.uri.fsPath));
        //console.log("PATH: ", localPath);

        let disposable = vscode.commands.registerCommand(
          "extension.showP5LiveEditorCanvas",
          () => {
            //console.log("PATH: ", localPath);
            if (currentPanel) {
              currentPanel.reveal(vscode.ViewColumn.Two);
            } else {
              const sketchPath =
                path.dirname(e.document.uri.fsPath) + path.sep + "sketch.js";
              const indexHTMLPath =
                path.dirname(e.document.uri.fsPath) + path.sep + "index.html";
              if (
                !(fs.existsSync(sketchPath) && fs.existsSync(indexHTMLPath))
              ) {
                vscode.window.showErrorMessage(
                  "This folder must contain index.html and sketch.js in order to open p5 live editor preview."
                );
                return;
              }
              currentPanel = vscode.window.createWebviewPanel(
                "p5-live-editor",
                "p5-live-editor",
                vscode.ViewColumn.Two,
                {
                  enableScripts: true,
                  localResourceRoots: [extensionPath, localPath],
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
      } else {
        statusBarItem.hide();
      }
    }
  );

  let extensionPath = vscode.Uri.file(
    vscode.extensions.getExtension("andreapollini.p5-live-editor").extensionPath
  );
  ////console.log("EXT PATH = ", extensionPath);
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
              localResourceRoots: [extensionPath, localPath],
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
        openLabel: "Open",
      };

      vscode.window.showOpenDialog(options).then((fileUri) => {
        if (fileUri && fileUri[0]) {
          ////console.log("Selected file: " + fileUri[0].fsPath);
          const projectNameInputOptions: vscode.InputBoxOptions = {
            prompt: "New P5 project name",
            password: false,
          };
          const projectFolder = fileUri[0].fsPath;
          vscode.window
            .showInputBox(projectNameInputOptions)
            .then((projectName) => {
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

let rnd = Math.random();
let lastStateWasError = false;

async function updateCode(editor, websocket, outputChannel) {
  if (!(currentPanel && currentPanel.webview)) {
    return;
  }
  if (!editor) {
    //console.log("Error: No document found");
    return;
  }
  if (editor.document.languageId !== "javascript") {
    //outputChannel.clear();
    currentPanel.webview.html = getWebviewContent(editor.document.getText());
    return;
  }
  let text = editor.document.getText();

  const JSHINTOptionsPath =
    vscode.extensions.getExtension("andreapollini.p5-live-editor")
      .extensionPath +
    path.sep +
    "assets" +
    path.sep +
    "jshint.json";
  const JSHINTOptions = JSON.parse(
    fs.readFileSync(JSHINTOptionsPath).toString()
  );

  // get included libs symbols included? I hope!
  let localPath = vscode.Uri.file(
    path.dirname(editor.document.uri.path) + path.sep
  ).with({
    scheme: "vscode-resource",
  }).fsPath;
  const dom = new JSDOM(fs.readFileSync(`${localPath + path.sep}index.html`));
  let extenalJSCodeParsed = "";
  let externalFiles = [];
  dom.window.document.querySelectorAll("script").forEach((x) => {
    //console.log(x.getAttribute("src"));
    externalFiles.push(x.getAttribute("src"));
  });
  //externalFiles.filter(x => x !== "sketch.js");

  //console.log("FILES: ", externalFiles);
  const remoteExternalFiles =
    (await Promise.all(
      externalFiles
        .filter((x) => x.startsWith("http"))
        .map((uri) => fetch(uri).then((r) => r.text()))
    ).then((results) => {
      // console.log(
      //   "EXTERNAL FILES: ",
      //   results.map(x => x.slice(0, 80))
      // );
      return results.reduce((acc, v) => acc + "\n" + v, "");
    })) || "";

  const localExternalFiles =
    externalFiles
      .filter((x) => !x.startsWith("http"))
      .map((x) => fs.readFileSync(path.join(localPath, x)))
      .reduce((acc, v) => acc + "\n" + v, "") || "";
  //console.log("EXTERNAL FILES: ", localExternalFiles);
  //console.log("FILES: ", externalFiles);
  extenalJSCodeParsed = fs
    .readdirSync(localPath)
    .filter((filename) => filename.split(".").pop() === "js")
    .filter((filename) => filename !== "sketch.js")
    .map((f) => fs.readFileSync(localPath + path.sep + f, "utf8"))
    .reduce((program, code) => program + "\n" + code, "");

  // get included symbols

  let options = {
    esversion: 6,
    undef: true,
    browser: true,
    node: true,
    //strict: "implied",
    "-W033": true,
    "-E058": true,
    "-E030": true,
    "-W008": true,
    "-E043": true,
  };

  const headers =
    "\n/* jshint ignore:start */\n" +
    `
  ${remoteExternalFiles}
  ${localExternalFiles}
 \n` +
    "\n/* jshint ignore:end */\n";

  const offset = headers.split(/\r\n|\r|\n/).length;

  JSHINT(headers + text, JSHINTOptions);
  let errors = JSHINT.errors;
  //console.log("JSHINT ERRORS: ", errors);
  errors = JSHINT.errors.filter(
    (error) =>
      !(error && error.evidence && error.evidence.includes(error.a + "("))
  );
  //console.log(errors);
  if (errors.length == 0) {
    if (lastStateWasError) {
      outputChannel.clear();
      rnd = Math.random();
      lastStateWasError = false;
    }
    //outputChannel.append("\n_______________________________________________\n");
    currentPanel.webview.html = getWebviewContent(text);
  } else {
    let message = "🛑 Errors:\n";

    let es6error = false;
    errors.forEach((element) => {
      message += `Line ${element.line - offset + 1}, col ${
        element.character
      }: ${element.reason}\n`;
    });
    outputChannel.clear();
    //outputChannel.append("\n_______________________________________________\n");
    outputChannel.append(message);

    currentPanel.webview.html = getWebviewContent(text);
    lastStateWasError = true;
  }
}

function getWebviewContent(code: String = "") {
  if (!vscode.window.activeTextEditor) return;
  let extensionPath = vscode.Uri.file(
    vscode.extensions.getExtension("andreapollini.p5-live-editor").extensionPath
  ).with({
    scheme: "vscode-resource",
  });

  let localPathForJS = vscode.Uri.file(
    path.dirname(vscode.window.activeTextEditor.document.uri.path) + path.sep
  ).with({
    scheme: "vscode-resource",
  });
  let localPath = vscode.Uri.file(
    path.dirname(vscode.window.activeTextEditor.document.uri.path) + path.sep
  ).with({
    scheme: "vscode-resource",
  }).fsPath;
  let ParsedCode = "";
  let extenalJSCodeParsed = "";
  if (localPath) {
    const sketchCode = fs.readFileSync(
      localPath + path.sep + "sketch.js",
      "utf8"
    );

    ////console.log("SKETCH CONTENT = ", sketchCode);

    ParsedCode = parser.parseCode(sketchCode);
    ////console.log("PARSED CODE:", ParsedCode);
    extenalJSCodeParsed = fs
      .readdirSync(localPath)
      .filter((filename) => filename.split(".").pop() === "js")
      .filter((filename) => filename !== "sketch.js")
      .map((f) => fs.readFileSync(localPath + path.sep + f, "utf8"))
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

     
    
     <!-- <style>
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
    </style>-->
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
        var loadJSON;
        var loadImage;
        var localPath;

        ${ParsedCode}

        window.localPath = decodeURI("${localPathForJS}");
        window.loadJSON = loadJSON;
        window.loadImage = loadImage;
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

       window.p5liveeditorrnd = ${rnd}; 
     </script>
      
    </body>
  </html>
  `);
  ////console.log("HTML -> ", baseDOM.window.document.documentElement.outerHTML);

  const baseDocument = baseDOM.window.document;
  const domDocument = dom.window.document;

  domDocument.querySelectorAll("head > script").forEach((element) => {
    ////console.log("el -> ", element.src);
    if (element.src.endsWith("sketch.js")) {
      element.remove();
      ////console.log("remove.");
    }
  });

  domDocument.querySelectorAll("body > script").forEach((element) => {
    ////console.log("el -> ", element.src);
    if (element.src.endsWith("sketch.js")) {
      element.remove();
      ////console.log("remove.");
    }
  });

  baseDocument.querySelector("head").innerHTML += domDocument.querySelector(
    "head"
  ).outerHTML;
  baseDocument.querySelector("body").innerHTML =
    domDocument.querySelector("body").outerHTML +
    baseDocument.querySelector("body").innerHTML;

  return baseDOM.window.document.documentElement.outerHTML;
}

export function deactivate() {
  websocket.dispose();
  websocket = null;
  return undefined;
}

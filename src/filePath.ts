import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { P5Project } from "./P5Project";

/// original file from: https://raw.githubusercontent.com/CertainLach/VSCode-Another-Project-Manager/master/src/pathUtil.ts

function isEmpty(path) {
  return fs.readdirSync(path).length === 0;
}

const homeDir = os.homedir();
const projectsFile = "projects.json";
export function getProjectFilePath() {
  const configuration = vscode.workspace.getConfiguration(
    "anotherProjectManager"
  );
  const projectsLocation: string | undefined = configuration.get(
    "projectsLocation"
  );
  return projectsLocation
    ? path.join(projectsLocation, projectsFile)
    : getFilePathFromAppData(projectsFile);
}
export function getFilePathFromAppData(file: string) {
  let addDataPath;
  let newFile;
  const channelPath = getChannelPath();
  if (process.env.VSCODE_PORTABLE) {
    addDataPath = process.env.VSCODE_PORTABLE;
    newFile = path.join(addDataPath, channelPath, "User", file);
    return newFile;
  }
  // in macOS
  addDataPath =
    process.platform === "darwin"
      ? process.env.HOME + "/Library/Application Support"
      : "/var/local";
  addDataPath = process.env.APPDATA || addDataPath;
  newFile = path.join(addDataPath, channelPath, "User", file);
  // in linux, it may not work with /var/local, then try to use /home/myuser/.config
  if (process.platform === "linux" && !fs.existsSync(newFile)) {
    newFile = path.join(homeDir, ".config/", channelPath, "User", file);
  }
  return newFile;
}
export function getChannelPath() {
  return process.env.VSCODE_PORTABLE
    ? "user-data"
    : vscode.env.appName.replace("Visual Studio ", "");
}

const getFilesInFolder = (folderPath: string): string[] => {
  const isFile = fileName => {
    return fs.lstatSync(fileName).isFile();
  };

  return fs
    .readdirSync(folderPath)
    .map(fileName => {
      return path.join(folderPath, fileName);
    })
    .filter(isFile);
};

export function loadProjects(filename: string): P5Project[] {
  if (!fs.existsSync(filename)) {
    vscode.window.showInformationMessage("Create file at: " + filename);
    fs.writeFileSync(filename, JSON.stringify([]));
    return [];
  }

  try {
    const items: P5Project[] = JSON.parse(fs.readFileSync(filename).toString());
    //console.log("LOAD PROJECTS ", items, " from file ", filename);
    const ret = items.map(
      item =>
        new P5Project(
          item.projectPath,
          item.name,
          getFilesInFolder(item.projectPath)
        )
    );
    return ret;
  } catch (error) {
    const optionOpenFile = { title: "Open File" };
    vscode.window
      .showErrorMessage("Error loading projects.json file.", optionOpenFile)
      .then(option => {
        if (option?.title === "Open File")
          vscode.commands.executeCommand("anotherProjectManager.exitProjects");
      });
    return [];
  }
}

export function createNewP5Project(
  projectName: string,
  projectPath: string
): void {
  const filename = getProjectFilePath();
  if (!fs.existsSync(filename)) {
    vscode.window.showErrorMessage("Error in P5 project file");
    return;
  }
  if (!isEmpty(projectPath)) {
    vscode.window.showErrorMessage("Your P5 project folder must be empty!");
    return;
  }
  const items: P5Project[] = JSON.parse(fs.readFileSync(filename).toString());
  items.push(new P5Project(projectPath, projectName));
  fs.writeFileSync(filename, JSON.stringify(items));

  const indexHTMLTemplateFilePath =
    vscode.extensions.getExtension("andreapollini.p5-live-editor")
      .extensionPath +
    path.sep +
    "assets" +
    path.sep +
    "index.html";

  const indexSketchTemplateFilePath =
    vscode.extensions.getExtension("andreapollini.p5-live-editor")
      .extensionPath +
    path.sep +
    "assets" +
    path.sep +
    "sketch.js";

  const destFile = projectPath + path.sep + "index.html";
  const destSketchFile = projectPath + path.sep + "sketch.js";

  //console.log("copy file ", indexHTMLTemplateFilePath, " ->> ", destFile);
  fs.createReadStream(indexHTMLTemplateFilePath).pipe(
    fs.createWriteStream(destFile)
  );

  fs.createReadStream(indexSketchTemplateFilePath).pipe(
    fs.createWriteStream(destSketchFile)
  );
  /*console.log(
    "copy file ",
    indexSketchTemplateFilePath,
    " ->> ",
    destSketchFile
  );*/

  vscode.commands.executeCommand("extension.refreshEntry");
}

export function DeleteP5Project(project: P5Project): void {
  const filename = getProjectFilePath();
  if (!fs.existsSync(filename)) {
    vscode.window.showErrorMessage("Error in P5 project file");
    return;
  }
  let items: P5Project[] = JSON.parse(fs.readFileSync(filename).toString());
  //console.log(items, project);
  items = items.filter(
    p => !(p.name == project.name && p.projectPath == project.projectPath)
  );
  fs.writeFileSync(filename, JSON.stringify(items));
  vscode.commands.executeCommand("extension.refreshEntry");
}

import * as vscode from "vscode";
import * as fs from "fs";
import { getProjectFilePath } from "../filePath";
import { P5Project } from "../P5Project";

interface IEntry {
  name: string;
  type: string;
}

interface IProjectEntity {
  path: string;
  name: string;
}

export interface Project {
  path: vscode.Uri;
  name: string;
  items: ProjectNode[];
}

export interface ProjectNode {
  path: vscode.Uri;
  type: string;
  items: ProjectNode[];
}

export class ProjectModel {
  private projectsMap: Map<string, ProjectNode> = new Map();

  constructor() {
    const filename = getProjectFilePath();
    if (!fs.existsSync(filename)) {
      vscode.window.showInformationMessage("Create file at: " + filename);
      fs.writeFileSync(filename, JSON.stringify([]));
    }
  }

  // public get projects(): Thenable<Project[]> {
  //   const filename = getProjectFilePath();
  //   if (!fs.existsSync(filename)) {
  //     vscode.window.showErrorMessage("Error opening file at: " + filename);
  //   }

  //   try {
  //     const items: IProjectEntity[] = JSON.parse(
  //       fs.readFileSync(filename).toString()
  //     );
  //     const projectsList: Project[] = items.map(item => ({
  //       path: vscode.Uri.file(item.path),
  //       name: item.name
  //     }));

  //     projectsList.forEach(project => {

  //     })

  //     console.log("LOAD PROJECTS ", items, " from file ", filename);
  //     return items;
  //   } catch (error) {
  //     const optionOpenFile = { title: "Open File" };
  //     vscode.window
  //       .showErrorMessage("Error loading projects.json file.", optionOpenFile)
  //       .then(option => {
  //         if (option?.title === "Open File")
  //           vscode.commands.executeCommand(
  //             "anotherProjectManager.exitProjects"
  //           );
  //       });
  //     return [];
  //   }
  // }
}

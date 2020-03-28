import * as vscode from "vscode";
import { loadProjects, getProjectFilePath } from "./filePath";
import * as path from "path";
import { P5Project, P5ProjectItem } from "./P5Project";
import { TreeItemCollapsibleState } from "vscode";
import { isString, isRegExp } from "util";

export class P5ProjectsProvider implements vscode.TreeDataProvider<P5Project> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<P5Project>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  projects: P5Project[];
  public selected: P5Project | undefined;

  constructor(rootPath: string) {
    this.projects = loadProjects(getProjectFilePath());

    this.selected = undefined;
  }

  refresh(): void {
    this.projects = loadProjects(getProjectFilePath());
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: P5Project): vscode.TreeItem | Thenable<vscode.TreeItem> {
    //console.log("getTreeItem ", element);

    return new P5ProjectItem(element, TreeItemCollapsibleState.Collapsed);
  }

  getChildren(element?: P5Project): Thenable<P5Project[]> {
    //console.log("getChildren of ", element);
    if (element) {
      let uri = vscode.Uri.file(element.projectPath);
      vscode.commands.executeCommand("vscode.openFolder", uri);
      vscode.commands.executeCommand("extension.selectProject", element);
      this.selected = element;
      return Promise.resolve([]);
    } else {
      if (!this.selected) return Promise.resolve(this.projects);
      else
        return Promise.resolve(
          this.projects.map(project => {
            if (project.name === this.selected.name) {
              project.name = "‣ " + project.name;
            } else return project;
          })
        );
    }
  }
  getParent?(element: P5Project): Thenable<P5Project> {
    //console.log("getParent ", element);
    throw new Error("Method not implemented.");
  }
}

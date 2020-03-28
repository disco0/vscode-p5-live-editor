import { TreeItem, TreeItemCollapsibleState } from "vscode";
import * as path from "path";

export class P5Project {
  constructor(
    public readonly projectPath: string,
    public name: string,
    public items: string[] = []
  ) {}
}

export class P5ProjectNode {
  constructor(
    public readonly projectPath: string,
    public readonly name: string,
    public items: string[] = []
  ) {}
}

export class P5FileItem extends TreeItem {
  private filename: string;
  constructor(private readonly itemPath) {
    super(path.basename(itemPath), TreeItemCollapsibleState.None);
    this.filename = path.basename(itemPath);
  }

  get description(): string {
    return `${this.filename})`;
  }
}

export class P5ProjectItem extends TreeItem {
  constructor(
    private readonly project: P5Project,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(project.name, collapsibleState);
  }
  get tooltip(): string {
    return `${this.project.name}`;
  }
  get description(): string {
    return `${this.project.name} - (${this.project.items.length})`;
  }
}

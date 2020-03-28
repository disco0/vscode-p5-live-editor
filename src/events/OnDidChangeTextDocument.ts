import * as vscode from "vscode";
import { isEditorDocumentLanguage } from "../utils";

export const OnDidChangeTextDocument = cb =>
  vscode.workspace.onDidChangeTextDocument(
    (e: vscode.TextDocumentChangeEvent) => {
      if (isEditorDocumentLanguage(e, "javascript")) {
        cb();
      }
    }
  );

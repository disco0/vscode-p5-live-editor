import * as vscode from "vscode";
import { isEditorDocumentLanguage } from "../utils";

export const OnDidChangeActiveTextEditor = cb =>
  vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
    cb(e);
  });

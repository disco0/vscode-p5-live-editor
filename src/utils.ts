import * as vscode from "vscode";

export const isEditorDocumentLanguage = (e, lang) =>
  e &&
  e.document &&
  vscode.window.activeTextEditor != undefined &&
  e.document === vscode.window.activeTextEditor.document &&
  e.document.languageId === lang;

import { WebSocketServer } from "./WebSocketServer";
import * as WebSocket from "ws";
import * as vscode from "vscode";
export const configWebSocketServer = (
  outputChannel: vscode.OutputChannel,
  lastKnownEditor: vscode.TextEditor
) => {
  return (server, updateCode) => {
    let ws: WebSocketServer = new WebSocketServer(outputChannel);
    ws.onListening = () => {
      server = ws.url;
    };
    ws.onConnection = () => {
      outputChannel.show(true);
      if (lastKnownEditor && lastKnownEditor.document) {
        updateCode(lastKnownEditor, ws, outputChannel);
      }
    };
    return ws;
  };
};

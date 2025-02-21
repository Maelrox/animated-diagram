import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('shapeflow.openDiagram', () => {
        ShapeFlowPanel.createOrShow(context.extensionUri);
    });

    context.subscriptions.push(disposable);
}

class ShapeFlowPanel {
    public static currentPanel: ShapeFlowPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.options = { enableScripts: true };
        this._panel.webview.html = this._getWebviewContent(extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        if (ShapeFlowPanel.currentPanel) {
            ShapeFlowPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'shapeFlow',
            'Shape Flow Diagram',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'webview')] // Allow access to `src/webview`

            }
        );

        ShapeFlowPanel.currentPanel = new ShapeFlowPanel(panel, extensionUri);
    }

    private _getWebviewContent(extensionUri: vscode.Uri): string {
        const webviewUri = this._panel.webview;
        const indexPath = path.join(extensionUri.fsPath, 'src', 'webview', 'index.html');
    
        if (!fs.existsSync(indexPath)) {
            return `<!DOCTYPE html><html><body><h1>Error: index.html not found</h1></body></html>`;
        }
    
        let html = fs.readFileSync(indexPath, 'utf8');
    
        // Convert local script references to `asWebviewUri`
        const scriptMainUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'main.js'));
        html = html.replace('<script src="main.js"></script>', `<script src="${scriptMainUri}"></script>`);

        const scriptAnimatorUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'animator.js'));
        html = html.replace('<script src="animator.js"></script>', `<script src="${scriptAnimatorUri}"></script>`);

        const scriptshapeManagerUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'shapeManager.js'));
        html = html.replace('<script src="shapeManager.js"></script>', `<script src="${scriptshapeManagerUri}"></script>`);

        const scriptImageUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'imageManager.js'));
        html = html.replace('<script src="imageManager.js"></script>', `<script src="${scriptImageUri}"></script>`);

        const scriptConnectorUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'connector.js'));
        html = html.replace('<script src="connector.js"></script>', `<script src="${scriptConnectorUri}"></script>`);

        const stylesUri = webviewUri.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'styles.css'));
        html = html.replace('<link href="styles.css" rel="stylesheet"/>', `<link href="${stylesUri}" rel="stylesheet"/>`);
        return html;
    }

    private dispose() {
        ShapeFlowPanel.currentPanel = undefined;
        this._panel.dispose();
    }
}

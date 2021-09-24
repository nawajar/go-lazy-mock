// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";

const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });

const getFilePath = (uri:vscode.Uri) => {
	const regex = /\/[A-Za-z0-9]+\.go/;
	const path = uri.path.replace(regex, '/');
	return path;
};

const genMockery = async (path: string): Promise<string> => {
	return await execShell(`cd ${path} && mockery  --all  --output .  --print`);
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "go-lazy-mock" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('go-lazy-mock.mockGen', async (uri:vscode.Uri) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const wsedit = new vscode.WorkspaceEdit();
		const path = getFilePath(uri);
		const newFile = vscode.Uri.file(path + '/mocks/mock_.go');
		wsedit.createFile(newFile, { ignoreIfExists: true });
		const mockContent = await genMockery(path);
		wsedit.insert(newFile,new vscode.Position(0, 0), mockContent);
		vscode.workspace.applyEdit(wsedit);
		vscode.window.showInformationMessage('go-lazy-mock! generated file', newFile.fsPath);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

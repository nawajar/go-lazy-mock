// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from "child_process";
import * as fs from 'fs';

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
	const regex = /\/[A-Za-z0-9_-]+\.go/;
	const path = uri.path.replace(regex, '/');
	return path;
};

const genMockery = async (path: string, interfaceName: string): Promise<string> => {
	return await execShell(`cd ${path} && mockery --name ${interfaceName} --print`);
};

const genMockeryRenameStruct = async (path: string, interfaceName: string, renameInterface: string): Promise<string> => {
	return await execShell(`cd ${path} && mockery --name ${interfaceName} --structname ${renameInterface} --print`);
};

const getInterfaces = (value: string): Array<string> => {
	const regex = /type\s([A-Za-z].*)\sinterface/g;
	var interfaces = new Array;
	let matches;
	while ((matches = regex.exec(value)) !== null) {
		interfaces.push(matches[1]);
	}
	return interfaces;
};

const getStructName = async (interfaceName: string): Promise<string> => {
	const structName = await vscode.window.showInputBox({
		placeHolder: "Enter rename struct",
		prompt: `rename struct for ${interfaceName}`,
		value: interfaceName
	  });
	  if(structName == ''){
		vscode.window.showErrorMessage('A struct name is mandatory to execute this action');
		return '';
	  }
	return structName == undefined ? '' : structName;  
};

export function activate(context: vscode.ExtensionContext) {
	console.log('"go-lazy-mock" is now active!');
	let disposable = vscode.commands.registerCommand('go-lazy-mock.mockGen', async (uri:vscode.Uri) => {
		var text = fs.readFileSync(uri.fsPath);
		const interfaces = getInterfaces(text.toString());
		const wsedit = new vscode.WorkspaceEdit();
		if(interfaces && interfaces.length > 0){
			const path = getFilePath(uri);
			for(const i of interfaces){
				const newFile = vscode.Uri.file(path + `/mocks/mock_${i}.go`);
				wsedit.createFile(newFile, { ignoreIfExists: true });
				const mockContent = await genMockery(path, i);
				wsedit.insert(newFile,new vscode.Position(0, 0), mockContent);
			}
			vscode.workspace.applyEdit(wsedit);
			vscode.window.showInformationMessage('go-lazy-mock! generated file');
		}
	});

	let disposableWithName = vscode.commands.registerCommand('go-lazy-mock.mockGenName', async (uri:vscode.Uri) => {
		
		var text = fs.readFileSync(uri.fsPath);
		const interfaces = getInterfaces(text.toString());
		const wsedit = new vscode.WorkspaceEdit();
		if(interfaces && interfaces.length > 0){
			const path = getFilePath(uri);
			for(const i of interfaces){
				const structName = await getStructName(i);
				if('' == structName) {
					continue;
				}
				const newFile = vscode.Uri.file(path + `/mocks/mock_${structName}.go`);
				wsedit.createFile(newFile, { ignoreIfExists: true });
				const mockContent = await genMockeryRenameStruct(path, i, structName);
				wsedit.insert(newFile,new vscode.Position(0, 0), mockContent);
			}
			vscode.workspace.applyEdit(wsedit);
			vscode.window.showInformationMessage('go-lazy-mock! generated file');
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableWithName);
}




// this method is called when your extension is deactivated
export function deactivate() {}

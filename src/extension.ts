// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import cp = require('child_process');

import * as vscode from 'vscode';


var outputChannel: vscode.OutputChannel;
var miloDiagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Milo');
	miloDiagnosticCollection = vscode.languages.createDiagnosticCollection('milo');
	context.subscriptions.push(miloDiagnosticCollection);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "milo" is now active!');

	// Run Milo when the document is opened.
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	miloVersion();
	miloReview(editor.document);
	
	// vscode.workspace.onDidOpenTextDocument((doc) => {
	// 	miloReview(doc);
	// }, null, context.subscriptions);

	// // // Run Milo when document content is changed or updated.
	// vscode.workspace.onDidChangeTextDocument((doc) => {
	// 	miloReview(doc.document);
	// }, null, context.subscriptions);
}

function miloVersion() {
	const stdout = cp.execSync('milo version');
	console.log(stdout.toString());
	if (stdout.length === 0) {
		const stdout = cp.execSync('go install github.com/wawandco/milo/cmd/milo@latest');
		console.log(stdout);
		outputChannel.append(stdout.toString());
	}
}

function miloReview(doc: vscode.TextDocument) {
	console.log(doc.languageId);
	if ((doc.languageId !== 'html' && doc.languageId !== 'plush') || doc.isUntitled) {
		return;
	}

	let uri = doc.uri;

	outputChannel.clear();
	console.log(`milo review ${uri.fsPath}`);
	cp.exec(`milo review ${uri.fsPath}`, (_err, stdout, _stderr) => {
		console.log(stdout, _err, _stderr);
		miloDiagnosticCollection.clear();

		let diagnostics: vscode.Diagnostic[] = [];

		const lines = stdout.toString().split('\n');
		for (const l of lines) {
			outputChannel.appendLine(l);
			const match = /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+)?)?:(?:\w+:)? (.*)$/.exec(l);
			if (!match) {
				continue;
			}
			const [, , , , line, , col, msg] = match;

			const range = new vscode.Range(parseInt(line) - 1, parseInt(col), parseInt(line) - 1, parseInt(col));
			const severity = vscode.DiagnosticSeverity.Warning;
			const diagnostic = new vscode.Diagnostic(range, msg, severity);
			diagnostic.source = miloDiagnosticCollection.name;
			diagnostics.push(diagnostic);
		}

		miloDiagnosticCollection.set(uri, diagnostics);
	});
}


// this method is called when your extension is deactivated
export function deactivate() { }

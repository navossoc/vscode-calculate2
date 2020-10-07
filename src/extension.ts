// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as math from 'mathjs';
import ErrorAlert from "./erroralert";

/**
 * Initialization code
 */
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('calculate2.calculate', runCalculate(insertResult))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('calculate2.calculateReplace', runCalculate(overwriteResult))
	);
}

function runCalculate(editMaker: IEditMaker) {
	return () => {

		const erroralert = new ErrorAlert();

		const editor = vscode.window.activeTextEditor;

		if (editor === undefined) {
			erroralert.throwSingleErrorImmediately("NO_FOCUS");
			return false;
		}

		editor.edit((textEditorEdit) => {
			editor.selections.forEach((selection, index) => {

				let selectedText = editor.document.getText(selection).replace(/\$i/g, String(index + 1));

				if (selectedText === "") {
					erroralert.saveError("NO_SELECT");
					return;
				}

				let comma = selectedText.indexOf(',') !== -1;
				if (comma) {
					selectedText = selectedText.replace(/,/g, '.');
				}

				let evaluatedMath;
				try {
					evaluatedMath = math.evaluate(selectedText);
				} catch (e) {
					erroralert.saveError("CALC_ERR", selectedText);
				}

				math.format(evaluatedMath, (value) => {
					if (value.toString().indexOf('.') !== -1) {
						value = round(value).toString();

						if (comma) {
							value = value.replace(/\./g, ',');
						}
					}

					// need to edit here, otherwise it may include a unit (ex: 5 inch)
					editMaker(textEditorEdit, selection, String(value));

					return value;
				});

			});

			erroralert.throwSavedErrorIfNecessary();
		});
	}
}

/**
 * A standard interface for making the edits
 */
interface IEditMaker {
	(edit: vscode.TextEditorEdit, selection: vscode.Selection, result: string): void;
}

let insertResult: IEditMaker = function (edit: vscode.TextEditorEdit, selection: vscode.Selection, result: string) {
	edit.insert(selection.end, "=" + result);
}

let overwriteResult: IEditMaker = function (edit: vscode.TextEditorEdit, selection: vscode.Selection, result: string) {
	console.log(result);
	edit.replace(selection, result);
}


function round(n: number) {
	// Round to 6 decimal places
	return Math.round(n * 1000000) / 1000000;
}

// this method is called when your extension is deactivated
export function deactivate() { }

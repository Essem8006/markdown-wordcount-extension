const vscode = require('vscode');

/** @type {vscode.StatusBarItem} */
let statusItem;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Right side of the status bar; higher priority = further left within that side
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  // Everything pushed to subscriptions is disposed automatically on deactivate
  context.subscriptions.push(
    statusItem,
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.window.onDidChangeTextEditorSelection((e) => update(e.textEditor)),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && e.document === editor.document) update(editor);
    })
  );

  // Show the count straight away for the file that triggered activation
  update(vscode.window.activeTextEditor);
}

/**
 * @param {vscode.TextEditor | undefined} editor 
 */
function update(editor) {
  if (!editor || editor.document.languageId !== 'markdown') {
    statusItem.hide();
    return;
  }

  const doc = editor.document;
  const total = countWords(doc.getText());

  // Supports multiple cursors/selections
  const selectedText = editor.selections
    .filter((s) => !s.isEmpty)
    .map((s) => doc.getText(s))
    .join(' ');
  const selected = selectedText ? countWords(selectedText) : 0;

  statusItem.text = selected > 0
    ? `$(pencil) ${selected} of ${total} words`
    : `$(pencil) ${total} words`;
  statusItem.tooltip = `Approx. ${Math.max(1, Math.round(total / 200))} min read`;
  statusItem.show();
}

function countWords(text) {
  const cleaned = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/, '') // YAML front matter
    .replace(/```[\s\S]*?```/g, '')                     // fenced code blocks
    .replace(/\]\([^)]*\)/g, ']')                       // keep link text, drop URL
    .replace(/<[^>]+>/g, '');                           // inline HTML tags

  // Letters/numbers in any script, allowing inner apostrophes and hyphens
  // (so "don't" and "well-known" count as one word each)
  const words = cleaned.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return words ? words.length : 0;
}

function deactivate() {}

module.exports = { activate, deactivate };
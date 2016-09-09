/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as os from 'os';
import * as minimist from 'minimist';
import * as assert from 'assert';
import { firstIndex } from 'vs/base/common/arrays';
import { localize } from 'vs/nls';

export interface ParsedArgs extends minimist.ParsedArgs {
	help?: boolean;
	version?: boolean;
	wait?: boolean;
	diff?: boolean;
	goto?: boolean;
	'new-window'?: boolean;
	'reuse-window'?: boolean;
	locale?: string;
	'user-data-dir'?: string;
	performance?: boolean;
	verbose?: boolean;
	logExtensionHostCommunication?: boolean;
	'disable-extensions'?: boolean;
	extensionHomePath?: string;
	extensionDevelopmentPath?: string;
	extensionTestsPath?: string;
	debugBrkPluginHost?: string;
	debugPluginHost?: string;
	'list-extensions'?: boolean;
	'install-extension'?: string | string[];
	'uninstall-extension'?: string | string[];
}

const options: minimist.Opts = {
	string: [
		'locale',
		'user-data-dir',
		'extensionHomePath',
		'extensionDevelopmentPath',
		'extensionTestsPath',
		'install-extension',
		'uninstall-extension',
		'debugBrkPluginHost',
		'debugPluginHost'
	],
	boolean: [
		'help',
		'version',
		'wait',
		'diff',
		'goto',
		'new-window',
		'reuse-window',
		'performance',
		'verbose',
		'logExtensionHostCommunication',
		'disable-extensions',
		'list-extensions'
	],
	alias: {
		help: 'h',
		version: 'v',
		wait: 'w',
		diff: 'd',
		goto: 'g',
		'new-window': 'n',
		'reuse-window': 'r',
		performance: 'p',
		'disable-extensions': 'disableExtensions'
	}
};

function validate(args: ParsedArgs): ParsedArgs {
	if (args.goto) {
		args._.forEach(arg => assert(/^(\w:)?[^:]+(:\d+){0,2}$/.test(arg), localize('gotoValidation', "Arguments in `--goto` mode should be in the format of `FILE(:LINE(:COLUMN))`.")));
	}

	return args;
}

function stripAppPath(argv: string[]): string[] {
	const index = firstIndex(argv, a => !/^-/.test(a));

	if (index > -1) {
		return [...argv.slice(0, index), ...argv.slice(index + 1)];
	}
}

/**
 * Use this to parse raw code process.argv such as: `Electron . --verbose --wait`
 */
export function parseMainProcessArgv(processArgv: string[]): ParsedArgs {
	let [, ...args] = processArgv;

	// If dev, remove the first non-option argument: it's the app location
	if (process.env['VSCODE_DEV']) {
		args = stripAppPath(args);
	}

	return validate(parseArgs(args));
}

/**
 * Use this to parse raw code CLI process.argv such as: `Electron cli.js . --verbose --wait`
 */
export function parseCLIProcessArgv(processArgv: string[]): ParsedArgs {
	let [,, ...args] = processArgv;

	if (process.env['VSCODE_DEV']) {
		args = stripAppPath(args);
	}

	return validate(parseArgs(args));
}

/**
 * Use this to parse code arguments such as `--verbose --wait`
 */
export function parseArgs(args: string[]): ParsedArgs {
	return minimist(args, options) as ParsedArgs;
}

export const optionsHelp: { [name: string]: string; } = {
	'-d, --diff': localize('diff', "Open a diff editor. Requires to pass two file paths as arguments."),
	'--disable-extensions': localize('disableExtensions', "Disable all installed extensions."),
	'-g, --goto': localize('goto', "Open the file at path at the line and column (add :line[:column] to path)."),
	'--locale <locale>': localize('locale', "The locale to use (e.g. en-US or zh-TW)."),
	'-n, --new-window': localize('newWindow', "Force a new instance of Code."),
	'-p, --performance': localize('performance', "Start with the 'Developer: Startup Performance' command enabled."),
	'-r, --reuse-window': localize('reuseWindow', "Force opening a file or folder in the last active window."),
	'--user-data-dir <dir>': localize('userDataDir', "Specifies the directory that user data is kept in, useful when running as root."),
	'--verbose': localize('verbose', "Print verbose output (implies --wait)."),
	'-w, --wait': localize('wait', "Wait for the window to be closed before returning."),
	'--extensionHomePath': localize('extensionHomePath', "Set the root path for extensions."),
	'--list-extensions': localize('listExtensions', "List the installed extensions."),
	'--install-extension <ext>': localize('installExtension', "Installs an extension."),
	'--uninstall-extension <ext>': localize('uninstallExtension', "Uninstalls an extension."),
	'-v, --version': localize('version', "Print version."),
	'-h, --help': localize('help', "Print usage.")
};

export function formatOptions(options: { [name: string]: string; }, columns: number): string {
	let keys = Object.keys(options);
	let argLength = Math.max.apply(null, keys.map(k => k.length)) + 2/*left padding*/ + 1/*right padding*/;
	if (columns - argLength < 25) {
		// Use a condensed version on narrow terminals
		return keys.reduce((r, key) => r.concat([`  ${ key }`, `      ${ options[key] }`]), []).join('\n');
	}
	let descriptionColumns = columns - argLength - 1;
	let result = '';
	keys.forEach(k => {
		let wrappedDescription = wrapText(options[k], descriptionColumns);
		let keyPadding = (<any>' ').repeat(argLength - k.length - 2/*left padding*/);
		if (result.length > 0) {
			result += '\n';
		}
		result += '  ' + k + keyPadding + wrappedDescription[0];
		for (var i = 1; i < wrappedDescription.length; i++) {
			result += '\n' + (<any>' ').repeat(argLength) + wrappedDescription[i];
		}
	});
	return result;
}

function wrapText(text: string, columns: number) : string[] {
	let lines = [];
	while (text.length) {
		let index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
		let line = text.slice(0, index).trim();
		text = text.slice(index);
		lines.push(line);
	}
	return lines;
}

export function buildHelpMessage(fullName: string, name: string, version: string): string {
	const columns = (<any>process.stdout).isTTY ? (<any>process.stdout).columns : 80;
	const executable = `${ name }${ os.platform() === 'win32' ? '.exe' : '' }`;

	return `${ fullName } ${ version }

${ localize('usage', "Usage") }: ${ executable } [${ localize('options', "options") }] [${ localize('paths', 'paths') }...]

${ localize('optionsUpperCase', "Options") }:
${formatOptions(optionsHelp, columns)}`;
}
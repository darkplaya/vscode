/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Severity from 'vs/base/common/severity';
import { TPromise } from 'vs/base/common/winjs.base';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export interface IExtensionDescription {
	id: string;
	name: string;
	version: string;
	publisher: string;
	isBuiltin: boolean;
	extensionFolderPath: string;
	extensionDependencies?: string[];
	activationEvents?: string[];
	engines: {
		vscode: string;
	};
	main?: string;
	contributes?: { [point: string]: any; };
}

export interface IActivationEventListener {
	(): void;
}

export interface IPointListener {
	(desc: IExtensionDescription[]): void;
}

export const IExtensionService = createDecorator<IExtensionService>('extensionService');

export interface IMessage {
	type: Severity;
	message: string;
	source: string;
}

export interface IExtensionsStatus {
	messages: IMessage[];
}

export interface IExtensionService {
	_serviceBrand: any;

	/**
	 * Send an activation event and activate interested extensions.
	 */
	activateByEvent(activationEvent: string): TPromise<void>;

	/**
	 * Block on this signal any interactions with extensions.
	 */
	onReady(): TPromise<boolean>;

	/**
	 * Get information about extensions status.
	 */
	getExtensionsStatus(): { [id: string]: IExtensionsStatus };
}

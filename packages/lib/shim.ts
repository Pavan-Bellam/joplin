let isTestingEnv_ = false;

const shim = {
	isNode: () => {
		if (typeof process === 'undefined') return false;
		if (shim.isElectron()) return true;
		return process.title == 'node' || (process.title && process.title.indexOf('gulp') === 0);
	},

	isReactNative: () => {
		if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('ReactNativeDebugger') >= 0) {
			return true;
		}

		return !shim.isNode();
	},

	isLinux: () => {
		return process && process.platform === 'linux';
	},

	isFreeBSD: () => {
		return process && process.platform === 'freebsd';
	},

	isWindows: () => {
		return process && process.platform === 'win32';
	},

	isMac: () => {
		return process && process.platform === 'darwin';
	},

	platformName: () => {
		if (shim.isReactNative()) return shim.mobilePlatform();
		if (shim.isMac()) return 'darwin';
		if (shim.isWindows()) return 'win32';
		if (shim.isLinux()) return 'linux';
		if (shim.isFreeBSD()) return 'freebsd';
		if (process && process.platform) return process.platform;
		throw new Error('Cannot determine platform');
	},

	// "ios" or "android", or "" if not on mobile
	mobilePlatform: () => {
		return ''; // Default if we're not on mobile (React Native)
	},

	// https://github.com/cheton/is-electron
	isElectron: () => {
		// Renderer process
		if (typeof window !== 'undefined' && typeof window.process === 'object' && (window.process as any).type === 'renderer') {
			return true;
		}

		// Main process
		if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!(process.versions as any).electron) {
			return true;
		}

		// Detect the user agent when the `nodeIntegration` option is set to true
		if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
			return true;
		}

		return false;
	},

	isPortable: ():boolean => {
		return typeof process !== 'undefined' && typeof process.env === 'object' && !!process.env.PORTABLE_EXECUTABLE_DIR;
	},

	// Node requests can go wrong is so many different ways and with so
	// many different error messages... This handler inspects the error
	// and decides whether the request can safely be repeated or not.
	fetchRequestCanBeRetried: (error:any) => {
		if (!error) return false;

		// Unfortunately the error 'Network request failed' doesn't have a type
		// or error code, so hopefully that message won't change and is not localized
		if (error.message == 'Network request failed') return true;

		// request to https://public-ch3302....1fab24cb1bd5f.md failed, reason: socket hang up"
		if (error.code == 'ECONNRESET') return true;

		// OneDrive (or Node?) sometimes sends back a "not found" error for resources
		// that definitely exist and in this case repeating the request works.
		// Error is:
		// request to https://graph.microsoft.com/v1.0/drive/special/approot failed, reason: getaddrinfo ENOTFOUND graph.microsoft.com graph.microsoft.com:443
		if (error.code == 'ENOTFOUND') return true;

		// network timeout at: https://public-ch3302...859f9b0e3ab.md
		if (error.message && error.message.indexOf('network timeout') === 0) return true;

		// name: 'FetchError',
		// message: 'request to https://api.ipify.org/?format=json failed, reason: getaddrinfo EAI_AGAIN api.ipify.org:443',
		// type: 'system',
		// errno: 'EAI_AGAIN',
		// code: 'EAI_AGAIN' } } reason: { FetchError: request to https://api.ipify.org/?format=json failed, reason: getaddrinfo EAI_AGAIN api.ipify.org:443
		//
		// It's a Microsoft error: "A temporary failure in name resolution occurred."
		if (error.code == 'EAI_AGAIN') return true;

		// request to https://public-...8fd8bc6bb68e9c4d17a.md failed, reason: connect ETIMEDOUT 204.79.197.213:443
		// Code: ETIMEDOUT
		if (error.code === 'ETIMEDOUT') return true;

		// ECONNREFUSED is generally temporary
		if (error.code === 'ECONNREFUSED') return true;

		return false;
	},

	fetchMaxRetry_: 5,

	fetchMaxRetrySet: (v:number) => {
		const previous = shim.fetchMaxRetry_;
		shim.fetchMaxRetry_ = v;
		return previous;
	},

	fetchWithRetry: async function(fetchFn:Function, options:any = null) {
		const time = require('lib/time').default;

		if (!options) options = {};
		if (!options.timeout) options.timeout = 1000 * 120; // ms
		if (!('maxRetry' in options)) options.maxRetry = shim.fetchMaxRetry_;

		let retryCount = 0;
		while (true) {
			try {
				const response = await fetchFn();
				return response;
			} catch (error) {
				if (shim.fetchRequestCanBeRetried(error)) {
					retryCount++;
					if (retryCount > options.maxRetry) throw error;
					await time.sleep(retryCount * 3);
				} else {
					throw error;
				}
			}
		}
	},

	fetch: (_url:string, _options:any):any => {
		throw new Error('Not implemented');
	},

	createResourceFromPath: async (_filePath:string, _defaultProps:any = null, _options:any = null) => {
		throw new Error('Not implemented');
	},

	FormData: typeof FormData !== 'undefined' ? FormData : null,

	fsDriver: ():any => {
		throw new Error('Not implemented');
	},

	FileApiDriverLocal: null as any,

	readLocalFileBase64: (_path:string) => {
		throw new Error('Not implemented');
	},

	uploadBlob: () => {
		throw new Error('Not implemented');
	},

	sjclModule: null as any,

	randomBytes: async (_count:number) => {
		throw new Error('Not implemented');
	},

	stringByteLength: (_s:string) => {
		throw new Error('Not implemented');
	},

	detectAndSetLocale: null as Function,

	attachFileToNote: async (_note:any, _filePath:string) => {
		throw new Error('Not implemented');
	},

	attachFileToNoteBody: async (_body:string, _filePath:string, _position:number, _options:any):Promise<string> => {
		throw new Error('Not implemented');
	},

	imageFromDataUrl: async (_imageDataUrl:string, _filePath:string, _options:any = null) => {
		throw new Error('Not implemented');
	},

	fetchBlob: async function(_url:string, _options:any = null) {
		throw new Error('Not implemented');
	},

	Buffer: null as any,

	openUrl: () => {
		throw new Error('Not implemented');
	},

	httpAgent: () => {
		throw new Error('Not implemented');
	},

	openOrCreateFile: (_path:string, _defaultContents:any) => {
		throw new Error('Not implemented');
	},

	waitForFrame: () => {
		throw new Error('Not implemented');
	},

	appVersion: () => {
		throw new Error('Not implemented');
	},

	injectedJs: (_name:string) => '',

	isTestingEnv: () => {
		return isTestingEnv_;
	},

	setIsTestingEnv: (v:boolean) => {
		isTestingEnv_ = v;
	},

	pathRelativeToCwd: (_path:string) => {
		throw new Error('Not implemented');
	},

	showMessageBox: (_message:string, _options:any = null) => {
		throw new Error('Not implemented');
	},

	writeImageToFile: (_image:any, _format:any, _filePath:string) => {
		throw new Error('Not implemented');
	},

	// setTimeout/setInterval are in the shim so that in Electron renderer process
	// we can force the use of the Node timers from the "timers" package. This is to go around
	// a bug that happened while testing plugins (on WSL2 / X-Server, so same as Linux):
	//
	// - The plugin would change some text in the editor
	// - The editor would schedule a save using setTimeout (via AsyncActionQueue)
	// - The timer would never get fired (although setTimeout was definitely called)
	//
	// It's not clear whether it is due to the code path originating in the plugin script or
	// some other bugs. But in any case, the issue was fixed using require('timers').setTimeout
	// instead of the default window.setTimeout. Might be related to this Electron bug:
	// https://github.com/electron/electron/issues/25311
	// (although changing allowRendererProcessReuse solved nothing)
	//
	// These unreliable timers might also be the reason for hard to replicate bugs in file watching
	// or the synchronisation freeze bug on Linux.
	//
	// Having the timers wrapped in that way would also make it easier to debug timing issue and
	// find out what timers have been fired or not.
	setTimeout: (_fn:Function, _interval:number) => {
		throw new Error('Not implemented');
	},

	setInterval: (_fn:Function, _interval:number) => {
		throw new Error('Not implemented');
	},

	clearTimeout: (_id:any) => {
		throw new Error('Not implemented');
	},

	clearInterval: (_id:any) => {
		throw new Error('Not implemented');
	},
};

export default shim;
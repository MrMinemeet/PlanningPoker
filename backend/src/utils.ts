// -----------------------------------------------------------------------------
// Type utilities
export function hasProperty<
	Obj extends object,
	Prop extends PropertyKey>
	(obj: Obj, prop: Prop): obj is Obj & Record<Prop, unknown> {
	return prop in obj;
}

// Logger
export class Logger {
	constructor(private readonly prefix: string) {
		this.prefix = prefix;
	}

	public log(level: string, ...args: any[]) {
		console.log(this.prefix, level, "|", ...args);
	}

	public info(...args: any[]) {
		this.log("INFO", ...args);
	}

	public warn(...args: any[]) {
		this.log("WARN", ...args);
	}

	public error(...args: any[]) {
		this.log("ERR ", ...args);
	}
}
import crypto from "node:crypto";
import * as constants from "./constants.js";

export class User {
	private readonly creationTimestamp: Date;
	private _lastActivityTime: Date;

	public readonly id: string;
	private _socketId: string | undefined;

	constructor(
		public readonly username: string
	) {
		this.id = crypto.randomBytes(constants.ID_ENTROPY_BYTES).toString(constants.ID_ENCODING);

		this.creationTimestamp = new Date();
		this._lastActivityTime = this.creationTimestamp;
	}

	public get lastActivityTime() {
		return this._lastActivityTime;
	}

	public updateActivity() {
		this._lastActivityTime = new Date();
	}

	public set socketId(newSocketId: string | undefined) {
		if (newSocketId?.trim().length === 0) {
			console.warn("Attempted to set empty socket ID");
		}
		this._socketId = newSocketId;
		this._lastActivityTime = new Date();
		console.debug(`User ${this.username} (${this.id}) socket ID updated to ${this._socketId}`);
	}

	public get socketId() {
		return this._socketId;
	}
}
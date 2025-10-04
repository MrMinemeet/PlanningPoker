import { randomBytes } from "node:crypto";
import { User } from "./user.js";
import * as constants from "./constants.js";

export class Room {
	private readonly creationTime: Date;
	private _lastActivityTime: Date;
	private readonly users: Set<User>;

	public readonly id: string;

	constructor(private readonly deckType: constants.DeckType) {
		this.id = randomBytes(constants.ID_ENTROPY_BYTES).toString(constants.ID_ENCODING);
		this.creationTime = new Date();
		this._lastActivityTime = this.creationTime
		this.users = new Set();

		console.info(`Room created with ID: ${this.id}`);
	}

	public get lastActivityTime() {
		return this._lastActivityTime;
	}

	public addUser(user: User) {
		this.users.add(user);
		this._lastActivityTime = new Date();
		console.debug(`User ${user.username} (${user.id}) added to room ${this.id}`);
	}

	public removeUser(user: User) {
		if (this.users.delete(user)) {
			this._lastActivityTime = new Date();
			console.debug(`User ${user.username} (${user.id}) removed from room ${this.id}`);
		}
	}
}

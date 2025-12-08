import { randomBytes } from "node:crypto";
import { User } from "./user.js";
import * as constants from "./constants.js";
import { Logger } from "./utils.js";

const logger = new Logger("room.ts");

type RoomState = {
	users: Array<{
		username: string; 
		voted: boolean;
	}>;
	votesRevealed: boolean;
	deck: string;
}

type UserState = {
	voted: boolean;
	votedValue: string | undefined;
}

type VotingResult = {
	userId: string;
	vote: string;
}

export class Room {
	private _lastActivityTime: Date;
	private _votesRevealed: boolean = false;
	private readonly creationTime: Date;
	private readonly users: Map<User, UserState>;

	public readonly id: string;

	constructor(private readonly deckType: constants.DeckType) {
		this.id = randomBytes(constants.ID_ENTROPY_BYTES).toString(constants.ID_ENCODING);
		this.creationTime = new Date();
		this._lastActivityTime = this.creationTime
		this.users = new Map();

		console.info(`Room created with ID: ${this.id}`);
	}

	public get lastActivityTime() {
		return this._lastActivityTime;
	}

	public get votesRevealed() {
		return this._votesRevealed;
	}

	public set votesRevealed(value: boolean) {
		this._votesRevealed = value;
		this._lastActivityTime = new Date();
	}

	public castVote(userId: string, vote: string) {
		if (this.votesRevealed) {
			logger.warn(`Cannot cast vote in room '${this.id}' because votes are already revealed!`);
			throw new Error("Votes are already revealed");
		}

		const entry = Array.from(this.users)
			.find(([user, state]) => user.id === userId);
		if (entry == null) {
			logger.warn(`User with ID '${userId}' not found in room '${this.id}'!`);
			throw new Error("User not found in room");
		}
		entry[1].voted = true;
		entry[1].votedValue = vote;
		this._lastActivityTime = new Date();
	}

	public addUser(user: User) {
		this.users.set(user, { voted: false, votedValue: undefined });
		this._lastActivityTime = new Date();
		console.debug(`User ${user.username} (${user.id}) added to room ${this.id}`);
	}

	public revealAndGetVotes(): VotingResult[] {
		this.votesRevealed = true;
		const results: VotingResult[] = [];
		for (const [user, state] of this.users) {
			if (state.voted && state.votedValue != null) {
				results.push({ userId: user.id, vote: state.votedValue });
			}
		}
		return results;
	}

	/**
	 * Removes a user from the room.
	 * @param user The user to remove.
	 * @returns True if the user was removed, otherwise false.
	 */
	public removeUser(user: User): boolean {
		if (this.users.delete(user)) {
			this._lastActivityTime = new Date();
			console.debug(`User ${user.username} (${user.id}) removed from room ${this.id}`);
			return true;
		}
		return false;
	}

	public resetVotes() {
		this._lastActivityTime = new Date();
		Array.from(this.users).forEach(([user, state]) => {
			user.updateActivity();
			state.voted = false;
			state.votedValue = undefined;
		});
		this.votesRevealed = false;
	}

	public getState(): RoomState {
		return {
			users: Array.from(this.users)
				.map(([user, userState]) => ({
					id: user.id,
					username: user.username,
					voted: userState.voted
				})),
			votesRevealed: this.votesRevealed,
			deck: this.deckType
		}
	}
}

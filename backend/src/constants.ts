export const ROOM_INACTIVITY_TIMEOUT = 60 * 60 * 1000;
export const USER_INACTIVITY_TIMEOUT = 60 * 60 * 1000;
export const CLEANUP_INTERVAL = 5 * 60 * 1000;

export const ID_ENTROPY_BYTES = 32; // 32 bytes = 256 bits
export const ID_ENCODING = "hex"; // Use hexadecimal encoding for IDs

export const Decks = [
	"fibonacci"
	// TODO: Add more when needed
] as const;
export type DeckType = (typeof Decks)[number];
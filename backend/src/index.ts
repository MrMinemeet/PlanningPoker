import Fastify, { type FastifyInstance } from "fastify";
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import { Socket, Server as SocketIOServer } from "socket.io";

import { Room } from "./room.js";
import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import { User } from "./user.js";

const logger = new Utils.Logger("[index.ts]");

const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/**
 * RoomId -> Room
 */
const activeRooms: Map<string, Room> = new Map();
/**
 * UserId -> User
 */
const activeUsers: Map<string, User> = new Map();

setInterval(() => {
	const now = Date.now();
	let oldSize: number;

	logger.info("Running cleanup of inactive rooms...");
	oldSize = activeRooms.size;
	for (const [key, room] of activeRooms) {
		if (now - room.lastActivityTime.getTime() > Constants.ROOM_INACTIVITY_TIMEOUT) {
			activeRooms.delete(key);
		}
	}
	if (oldSize !== activeRooms.size) {
		const room = Array.from(activeRooms)
		logger.info(`Cleaned up ${oldSize - activeRooms.size} inactive rooms.`);
	}

	logger.info("Running cleanup of inactive users...");
	oldSize = activeUsers.size;
	for (const [key, user] of activeUsers) {
		if (now - user.lastActivityTime.getTime() > Constants.USER_INACTIVITY_TIMEOUT) {
			activeUsers.delete(key);
		}
	}
	if (oldSize !== activeUsers.size) {
		logger.info(`Cleaned up ${oldSize - activeUsers.size} inactive users.`);
	}
}, Constants.CLEANUP_INTERVAL);

main();

// -----------------------------------------------------------------------------

async function main() {
	const fastify = Fastify({ logger: true });
	await fastify.register(cors, {});

	process.on("SIGTERM", () => {
		shutdown(fastify, "SIGTERM");
	});
	process.on("SIGINT", () => {
		shutdown(fastify, "SIGINT");
	});

	const websocket = new SocketIOServer(fastify.server, {
		cors: {
			origin: '*',
			methods: ["GET", "POST"],
			credentials: true
		}
	});

	registerFastifyRoutes(fastify);
	registerWebsocketHandlers(websocket);

	try {
		await fastify.listen({ port: HTTP_PORT, host: '0.0.0.0' })
		fastify.log.info(`Server listening on htt://0.0.0.0:${HTTP_PORT}`);
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

function emitRoomState(socket: SocketIOServer, roomId: string) {
	const room = activeRooms.get(roomId)
	if (room == null) {
		logger.warn(`Cannot emit room state for non-existing ${roomId}`);
		return;
	}

	logger.info("Emitting room state:", roomId);
	socket.in(roomId).emit("roomState", room.getState());
}

function emitVotes(socket: SocketIOServer, roomId: string) {
	const room = activeRooms.get(roomId)
	if (room == null) {
		logger.warn(`Cannot emit votes for non-existing ${roomId}`);
		return;
	}

	logger.info("Emitting votes for:", roomId);
	socket.in(roomId).emit("votesRevealed", room.revealAndGetVotes());
}


// Fastify routes
function registerFastifyRoutes(instance: Fastify.FastifyInstance) {
	// Serve static files from the public directory in production
	// Built frontend files should be placed there by Dockerfile
	if (process.env.NODE_ENV === 'production') {
		logger.info("Running in production mode");
		
		// Serve static files at root for nginx-proxied requests
		instance.register(staticFiles, {
			root: path.join(path.dirname(fileURLToPath(import.meta.url)), '../public'),
			prefix: '/',
			decorateReply: false
		});
	}

	instance.get("/api/create-user", async (request, reply) => {
		if (request.query == null
			|| typeof (request.query) !== "object"
			|| !Utils.hasProperty(request.query, "username")
			|| typeof (request.query.username) !== "string"
		) {
			reply.status(400);
			return { error: "Missing 'username' query parameter" };
		}

		const user = new User(request.query.username as string);
		activeUsers.set(user.id, user);
		logger.info(`Created new user: ${user.username} (${user.id})`);

		return { userId: user.id, ttl: Constants.USER_INACTIVITY_TIMEOUT };
	});

	instance.get("/api/create-room", async (request, reply) => {
		if (request.query == null
			|| typeof (request.query) !== "object"
			|| !Utils.hasProperty(request.query, "deck")
			|| !Constants.Decks.includes(request.query.deck as Constants.DeckType)
		) {
			reply.status(400);
			return {
				error: "Missing 'deck' query parameter",
				validDecks: Constants.Decks
			};
		}

		const room = new Room(request.query.deck as Constants.DeckType);
		activeRooms.set(room.id, room);
		logger.info(`Created new room: ${room.id} (Deck: ${request.query.deck})`);

		return { roomId: room.id };
	});

	instance.get("/api/health", async (request, reply) => {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			activeRooms: activeRooms.size,
			activeUsers: activeUsers.size
		};
	});
}

type SendVoteData = {
	roomId: string;
	userId: string;
	vote: string;
}

// Websocket handling
function registerWebsocketHandlers(websocket: SocketIOServer) {
	websocket.on("connection", (socket) => {
		logger.info(`New client websocket connection: ${socket.id}`);

		socket.on("sendVote", (data: SendVoteData) => {
			logger.info(`Received vote from '${data.userId}`);
			try {
				activeRooms.get(data.roomId)?.castVote(data.userId, data.vote);
				emitRoomState(websocket, data.roomId);
			} catch (e) {
				logger.warn("Error casting vote:", (e as Error).message);
				emitError(socket, "sendVote", (e as Error).message);
			}
		});

		socket.on("resetVotes", (data: { roomId: string }) => {
			logger.info("Received request to reset votes");
			activeRooms.get(data.roomId)?.resetVotes();
			emitRoomState(websocket, data.roomId);
		});

		socket.on("revealVotes", (data: { roomId: string }) => {
			logger.info("Received request to reveal votes");
			emitVotes(websocket, data.roomId);
		});

		socket.on("joinRoom", (data) => {
			if (typeof (data) === "string") {
				try {
					data = JSON.parse(data);
				} catch (e: unknown) {
					logger.warn("Invalid JSON in joinRoom:", e);
					emitError(socket, "joinRoom", "Invalid JSON format");
					return;
				}
			}
			const { roomId, userId } = data;
			const room = activeRooms.get(roomId);
			const user = activeUsers.get(userId);

			if (room == null || user == null) {
				logger.warn(`Invalid room (${roomId}) or user (${userId}) in joinRoom`);
				emitError(socket, "joinRoom", "Invalid room ID or user ID");
				return;
			}

			user.socketId = socket.id;
			room.addUser(user);
			logger.info(`User ${user.username} (${user.id}) joined room ${room.id}`);

			socket.join(roomId);

			emitRoomState(websocket, roomId);
		});

		socket.on("disconnect", () => {
			logger.info(`Websocket disconnected: ${socket.id}`);
			const user = Array.from(activeUsers.values())
				.find(user => user.socketId === socket.id);
			if (user == null) {
				logger.warn(`Could not find user for disconnected socket: ${socket.id}`);
				return;
			}

			// Drop User from room
			for (const room of activeRooms.values()) {
				if (room.removeUser(user)) {
					logger.info(`User ${user.id} removed from room ${room.id} due to disconnection`);
					emitRoomState(websocket, room.id);
					break; // Assumption: A user can only be in one room at a time
				}
			}
		});
	});
}

function emitError(socket: Socket, receivedEvent: string, message: string) {
	logger.info("Emitting error:", message);
	socket.emit("socketError", { receivedEvent, message });
}

function shutdown(fastify: FastifyInstance, event: string) {
	logger.info(`Received ${event}, shutting down server...`);
	fastify.close().then(() => {
		logger.info("Server shut down gracefully.");
		process.exit(0);
	}).catch((err: unknown) => {
		logger.error("Error during server shutdown:", err);
		process.exit(1);
	});
}
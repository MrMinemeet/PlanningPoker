import Fastify from "fastify";
import cors from '@fastify/cors'
import { Server as SocketIOServer } from "socket.io";

import { Room } from "./room.js";
import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import { User } from "./user.js";

const logger = new Utils.Logger("[index.ts]");

const activeRooms: Map<string, Room> = new Map();
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
		await fastify.listen({ port: 3000 })
		fastify.log.info("Server listening on http://localhost:3000");
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
	socket.to(roomId).emit("roomState", room.getState());
}


// Fastify routes
function registerFastifyRoutes(instance: Fastify.FastifyInstance) {
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
			activeRooms.get(data.roomId)?.castVote(data.userId, data.vote);
			emitRoomState(websocket, data.roomId);
		});

		socket.on("joinRoom", (data) => {
			if (typeof (data) === "string") {
				try {
					data = JSON.parse(data);
				} catch (e) {
					logger.error(`Invalid JSON in joinRoom: ${data}`);
					return;
				}
			}
			const { roomId, userId } = data;
			const room = activeRooms.get(roomId);
			const user = activeUsers.get(userId);

			if (room == null || user == null) {
				logger.warn(`Invalid room (${roomId}) or user (${userId}) in joinRoom`);
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

			// Remove users associated with this socket
			activeUsers.values()
				.filter(user => user.socketId === socket.id)
				.forEach(user => {
					activeRooms.forEach(room => room.removeUser(user));
				});
		});
	});
}
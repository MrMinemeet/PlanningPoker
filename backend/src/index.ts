import http from "node:http";
import Fastify from "fastify";
import { Server as SocketIOServer } from "socket.io";

import { Room } from "./room.js";
import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import { User } from "./user.js";

const activeRooms: Map<string, Room> = new Map();
const activeUsers: Map<string, User> = new Map();

setInterval(() => {
	const now = Date.now();
	let oldSize: number;

	console.info("Running cleanup of inactive rooms...");
	oldSize = activeRooms.size;
	for (const [key, room] of activeRooms) {
		if (now - room.lastActivityTime.getTime() > Constants.ROOM_INACTIVITY_TIMEOUT) {
			activeRooms.delete(key);
		}
	}
	if (oldSize !== activeRooms.size) {
			const room = Array.from(activeRooms)
		console.info(`Cleaned up ${oldSize - activeRooms.size} inactive rooms.`);
	}

	console.info("Running cleanup of inactive users...");
	oldSize = activeUsers.size;
	for (const [key, user] of activeUsers) {
		if (now - user.lastActivityTime.getTime() > Constants.USER_INACTIVITY_TIMEOUT) {
			activeUsers.delete(key);
		}
	}
	if (oldSize !== activeUsers.size) {
		console.info(`Cleaned up ${oldSize - activeUsers.size} inactive users.`);
	}
}, Constants.CLEANUP_INTERVAL);

main();

// -----------------------------------------------------------------------------

async function main() {
	const fastify = Fastify({ logger: true });
	const websocket = new SocketIOServer(fastify.server, {
		cors: {
			origin: '*',
			methods: ["GET", "POST"]
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


// Fastify routes
function registerFastifyRoutes(instance: Fastify.FastifyInstance) {

	instance.get("/create-user", async (request, reply) => {
		if (request.query == null
			|| typeof (request.query) !== "object"
			|| !Utils.hasProperty(request.query, "username")
			|| typeof(request.query.username) !== "string"
		) {
			reply.status(400);
			return { error: "Missing 'username' query parameter" };
		}

		const user = new User(request.query.username as string);
		activeUsers.set(user.id, user);
		console.info(`Created new user: ${user.username} (${user.id})`);

		return { userId: user.id, ttl: Constants.USER_INACTIVITY_TIMEOUT };
	});

	instance.get("/create-room", async (request, reply) => {
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
		console.info(`Created new room: ${room.id} (Deck: ${request.query.deck})`);

		return { roomId: room.id };
	});
}

// Websocket handling
function registerWebsocketHandlers(websocket: SocketIOServer) {
	websocket.on("connection", (socket) => {
		console.info(`New client websocket connection: ${socket.id}`);

		socket.on("joinRoom", (data) => {
			if (typeof(data) === "string") {
				data = JSON.parse(data);
			}
			const { roomId, userId } = data;
			const room = activeRooms.get(roomId);
			const user = activeUsers.get(userId);

			if (room == null || user == null) {
				console.warn(`Invalid room (${roomId}) or user (${userId}) in joinRoom`);
				return;
			}
			
			user.socketId = socket.id;
			room.addUser(user);
			console.info(`User ${user.username} (${user.id}) joined room ${room.id}`);

			socket.join(roomId);
		});

		socket.on("disconnect", () => {
			console.info(`Websocket disconnected: ${socket.id}`);

			// Remove users associated with this socket
			activeUsers.values()
				.filter(user => user.socketId === socket.id)
				.forEach(user => {
					user.socketId
					activeRooms.forEach(room => room.removeUser(user));
				});
		});
	});
}
# The Backend
This directory contains the backend code for the project. It is built with Node.js using Fastify for regular HTTP API and Socket.IO for real-time communication.

## HTTP API
These API endpoints are available:
* GET `/create-user` - Creates a new user
  - Parameters:
    * `username` (string, required): The desired username for the user
  - Response:
	* `userId` (string): The unique ID of the created user
	* `ttl` (number): The time-to-live of the user ID in minutes
* GET `/create-room` - Creates a new room
  - Parameters:
    * `deck` (string, required): The type of deck to use for the room. Valid values are listed in the response if an invalid or missing deck is provided.
  - Response:
    * `roomId` (string): The unique ID of the created room

## WebSocket Events
These WebSocket events are available.
**Client → Server**
* `joinRoom` - Joins a room using the room ID
  - Data: `{ roomId: string, userId: string }`
* `leaveRoom` - Leaves the current room
  - Data: `{ roomId: string, userId: string }`
* `sendVote` - Send vote to the room
  - Data: `{ roomId: string, userId: string, vote: string }`
* `revealVotes` - Reveal all votes in the room
  - Data: `{ roomId: string }`
* `resetVotes` - Reset all votes in the room
  - Data: `{ roomId: string }`

**Server → Client**
* `roomState` - Sends the current state of the room
  - Data: `{ users: Array<{ userName: string, voted: boolean }>, votesRevealed: boolean, deck: string }`
* `votesRevealed` - Sends all votes in the room when they are revealed
  - Data: `{ votes: Array<{ userName: string, vote: string | null }> }`
* `votesReset` - Notifies that all votes have been reset
  - Data: `{}`
* `error` - Sends an error message
  - Data: `{ receivedEvent: string, message: string }`
  - This event is sent when an error occurs, such as trying to join a non-existent room.
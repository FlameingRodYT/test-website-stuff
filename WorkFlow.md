## Data flows

### Registration
1. POST /api/auth/register
2. Create user in DB
3. $addToSet user into Cantina + their faction room
4. Sign JWT, return to client
5. Client stores in sessionStorage via AuthContext

### Faction change
1. PATCH /api/user/me
2. $pull user from old faction room
3. $addToSet user into new faction room
4. Update JWT payload in sessionStorage via login()

### Room creation
1. POST /api/rooms (authenticateToken)
2. Find all eligible users by faction
3. Create room with memberIds[]
4. Populate + return to client
5. Client appends to rooms state
6. Members useEffect fires, updates panel

## WebSocket events
- join → load history, attach roomId to client
- message → save to DB, broadcast to room
- typing/stopTyping → broadcast to room (exclude sender)
- presence -> broadcast if a user has connected

## Search feature

## Joining a room

## Online/offline
1. User registers or logsin -> POST/ PATCH /auth/login or /auth/register
2. WS recongises that a user has registered or is on the website
3. Grab all users and braodcast the presence data type 
4. useWebscoket.js receives message and puts it into a variable 
5. Chat.jsx recognises the users in the roomOnlineMembers and sets the client correctly to offline/ online

## Pending / TODO
- Roles system (admin, member)
- Search feature
- Join button for voluntary rooms
- Avatar upload
- broadcast to all users that a user is offline
- boradcast to all users that someone left the server
- boradcast to all users that someone has joined a server
# NearbyTalk — Architecture & Documentation

> Anonymous, encrypted, location-based chat app with voice/video calls, group rooms, and watch-together.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Route Paths](#route-paths)
5. [Data Flow & Logic](#data-flow--logic)
6. [Firebase Schema](#firebase-schema)
7. [Encryption Design](#encryption-design)
8. [File Reference](#file-reference)
9. [Component Tree](#component-tree)
10. [Security & Safety](#security--safety)

---

## Overview

NearbyTalk is a real-time peer-to-peer anonymous chat application. Users get a random nickname on first visit (no signup), share their GPS location, and get matched with strangers within a chosen radius. All messages are end-to-end encrypted using AES-256-GCM with ECDH P-256 key exchange. The app also supports voice/video calls via WebRTC, a friend system with shareable codes, group chat rooms with room codes, and a "Watch Together" video streaming feature.

### Key Features

- **Zero signup** — Anonymous Firebase auth, random nickname (e.g. "BraveEagle42")
- **GPS matching** — Find strangers within 5/10/25/50 km radius using geohash
- **E2E encryption** — AES-256-GCM, ECDH P-256 key exchange per chat
- **Voice & video calls** — WebRTC peer-to-peer, no media servers
- **Group rooms** — Create/join with 6-char room codes, up to 10 members
- **Group encryption** — Group AES key distributed via pairwise ECDH
- **Friend system** — Add friends by code, persistent chat rooms
- **Watch together** — Share local video file with synced playback
- **Safety** — Report, block, profanity filter, auto-ban at 5 reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7 |
| Build | Vite 7 |
| Auth | Firebase Anonymous Auth |
| Database | Firebase Firestore (metadata, signaling) |
| Messages | Firebase Realtime Database (encrypted messages) |
| Calls | WebRTC with Google STUN servers |
| Encryption | Web Crypto API (ECDH P-256 + AES-256-GCM) |
| Video Sync | Firestore sync state + `captureStream()` API |

---

## Project Structure

```
nearbytalk/
├── public/
├── src/
│   ├── main.jsx                          # React entry point
│   ├── App.jsx                           # Router + AuthProvider wrapper
│   ├── App.css                           # All styles (blue/purple theme)
│   │
│   ├── config/
│   │   └── firebase.js                   # Firebase init (auth, db, rtdb)
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx               # Global auth state provider
│   │
│   ├── crypto/
│   │   ├── keyManager.js                 # ECDH P-256 keypair generate/export/import
│   │   ├── encryption.js                 # AES-GCM encrypt/decrypt + ECDH shared key
│   │   └── groupKeyManager.js            # Group AES key generate/encrypt per member
│   │
│   ├── hooks/
│   │   ├── useAnonymousAuth.js           # Anonymous login + nickname generation
│   │   ├── useGeolocation.js             # Browser GPS + geohash encoding
│   │   ├── useMatchmaking.js             # Stranger matching orchestration
│   │   ├── useEncryptedChat.js           # 1-on-1 E2E encrypted chat
│   │   ├── useGroupChat.js               # Group E2E encrypted chat
│   │   ├── useWebRTC.js                  # 1-on-1 WebRTC calls
│   │   ├── useGroupWebRTC.js             # Group mesh WebRTC calls
│   │   ├── useFriends.js                 # Friend list + requests
│   │   ├── useGroups.js                  # Group CRUD + join by code
│   │   ├── useBlockList.js               # Block list (local + Firebase)
│   │   ├── useRateLimiter.js             # Message rate limiting
│   │   ├── useVideoSync.js              # Video playback sync state
│   │   └── useVideoStream.js             # captureStream() broadcasting
│   │
│   ├── services/
│   │   ├── authService.js                # Firebase anonymous auth calls
│   │   ├── chatService.js                # Send/subscribe encrypted messages
│   │   ├── callService.js                # 1-on-1 call signaling (offer/answer/ICE)
│   │   ├── matchingService.js            # Queue join/leave/find/listen
│   │   ├── friendService.js              # Friend code register/lookup/request/accept
│   │   ├── groupService.js               # Group create/join/leave/kick + key publish
│   │   ├── groupCallService.js           # Group call signaling (per-pair)
│   │   ├── blockService.js               # Block/unblock + sync
│   │   ├── reportService.js              # Report user + auto-ban
│   │   ├── videoSyncService.js           # Firestore video sync state
│   │   └── userService.js                # Presence + nearby user queries
│   │
│   ├── utils/
│   │   ├── constants.js                  # App-wide constants
│   │   ├── nicknameGenerator.js          # Random nickname + friend code + color
│   │   ├── geohash.js                    # Geohash encode/decode/neighbors/distance
│   │   ├── profanityFilter.js            # Leet-speak aware profanity filter
│   │   └── rateLimiter.js                # Sliding window rate limiter
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx               # Hero + features + create/join room
│   │   ├── LobbyPage.jsx                 # Matchmaking dashboard
│   │   ├── ChatPage.jsx                  # 1-on-1 encrypted chat
│   │   ├── CallPage.jsx                  # 1-on-1 audio/video call
│   │   ├── FriendsPage.jsx               # Friends + groups management
│   │   ├── GroupChatPage.jsx             # Group encrypted chat
│   │   └── GroupCallPage.jsx             # Group video/audio call
│   │
│   └── components/
│       ├── landing/
│       │   └── LandingHero.jsx           # Hero section with CTA buttons
│       ├── lobby/
│       │   └── SearchingOverlay.jsx      # Pulse animation + cancel
│       ├── chat/
│       │   ├── EncryptionBanner.jsx      # E2E status indicator
│       │   ├── MessageList.jsx           # Scrollable message container
│       │   ├── MessageBubble.jsx         # Individual message (text/system/sync)
│       │   └── ChatInput.jsx             # Text input + send + profanity warning
│       ├── call/
│       │   ├── AudioCallUI.jsx           # Audio call display
│       │   ├── VideoCallUI.jsx           # Video call with PiP
│       │   └── CallControls.jsx          # Mute/video/end buttons
│       ├── friends/
│       │   ├── FriendCodeCard.jsx        # Display + copy friend code
│       │   ├── AddFriendModal.jsx        # Add friend by code
│       │   ├── FriendRequestItem.jsx     # Accept/decline request
│       │   └── FriendsList.jsx           # Friends list with chat button
│       ├── group/
│       │   ├── CreateGroupModal.jsx      # Create room + show code
│       │   ├── JoinGroupModal.jsx        # Join room by code
│       │   ├── GroupInviteItem.jsx       # Invite display
│       │   ├── GroupListItem.jsx         # Room in list with code
│       │   ├── MemberList.jsx            # Member panel with kick
│       │   └── GroupCallGrid.jsx         # NxN video grid
│       ├── video/
│       │   └── VideoPlayer.jsx           # Watch together player + sync
│       ├── safety/
│       │   ├── ReportModal.jsx           # Report with reason selection
│       │   └── BlockConfirmModal.jsx     # Block confirmation
│       └── shared/
│           ├── LoadingSpinner.jsx        # Animated spinner
│           ├── NicknameAvatar.jsx        # Colored initials avatar
│           └── RadiusSelector.jsx        # Radius dropdown (5-50km)
│
├── .env.local                            # Firebase config (env vars)
├── vite.config.js                        # Vite + React plugin + host:true
├── package.json                          # Dependencies
└── ARCHITECTURE.md                       # This file
```

**File Count**: 66 source files (7 pages, 22 components, 12 hooks, 11 services, 3 crypto, 5 utils, 1 config, 1 context, 1 CSS, 2 entry files, 1 env)

---

## Route Paths

| Path | Page | Description |
|------|------|-------------|
| `/` | `LandingPage` | Landing hero, features, create/join room buttons |
| `/lobby` | `LobbyPage` | Matchmaking dashboard — find a stranger |
| `/friends` | `FriendsPage` | Friend list, requests, group rooms |
| `/chat/:roomId` | `ChatPage` | 1-on-1 encrypted chat with a stranger or friend |
| `/call/:roomId` | `CallPage` | 1-on-1 audio or video call |
| `/group/:groupId` | `GroupChatPage` | Group encrypted chat room |
| `/group-call/:callId` | `GroupCallPage` | Group audio/video call (mesh WebRTC) |

### Query Parameters

**ChatPage** (`/chat/:roomId`):
- `peer` — Peer's UID
- `nick` — Peer's nickname
- `friend=1` — Flag for friend chat (skips room cleanup on end)

**CallPage** (`/call/:roomId`):
- `peer` — Peer's UID
- `nick` — Peer's nickname
- `type` — `audio` or `video`
- `friend=1` — Friend chat flag

**GroupCallPage** (`/group-call/:callId`):
- `groupId` — The group this call belongs to
- `type` — `audio` or `video`

---

## Data Flow & Logic

### 1. Authentication Flow

```
App loads
  → AuthProvider wraps entire app
    → useAnonymousAuth() runs
      → Check localStorage for existing nickname/friendCode
      → Firebase signInAnonymously()
      → If new user: generateNickname() → "BraveEagle42"
      → generateFriendCode() → "NT-BraveEagle42-a1b2"
      → Store in localStorage + register in Firestore
      → Provide {user, nickname, friendCode} via context
```

### 2. Stranger Matching Flow

```
User at /lobby clicks "Find a Stranger"
  │
  ├─ useMatchmaking.startSearching()
  │   ├─ joinQueue(uid, nickname, geohash, lat, lng, radiusKm)
  │   │   └─ Write to Firestore: matchQueue/{uid}
  │   │
  │   ├─ findMatch() — immediate attempt
  │   │   ├─ Query matchQueue where status == "searching"
  │   │   ├─ Filter: exclude self, blocked users
  │   │   ├─ Calculate haversine distance for each candidate
  │   │   ├─ Filter by radius, sort by nearest
  │   │   ├─ Firestore transaction:
  │   │   │   ├─ Create chatRooms/{newRoomId}
  │   │   │   ├─ Update both users: status → "matched", roomId
  │   │   │   └─ Return { roomId, peerUid, peerNickname }
  │   │   └─ If no match found → continue to listen
  │   │
  │   ├─ listenForMatch(uid) — Firestore onSnapshot on matchQueue/{uid}
  │   │   └─ When status changes to "matched" → return match data
  │   │
  │   └─ Retry interval: findMatch() every 3 seconds
  │
  ├─ On match found:
  │   └─ navigate(`/chat/${roomId}?peer=${peerUid}&nick=${peerNickname}`)
  │
  └─ On cancel:
      ├─ Set activeRef = false (stops retries)
      └─ leaveQueue(uid) — delete from matchQueue
```

### 3. E2E Encrypted Chat Flow (1-on-1)

```
ChatPage mounts with roomId + peerUid
  │
  ├─ useEncryptedChat initializes
  │   │
  │   ├─ Step 1: Key Generation
  │   │   ├─ generateKeyPair() → ECDH P-256 {publicKey, privateKey}
  │   │   ├─ exportPublicKey() → JWK format
  │   │   └─ Publish to Firestore: chatRooms/{roomId}/keys/{myUid}
  │   │
  │   ├─ Step 2: Key Exchange
  │   │   ├─ onSnapshot: chatRooms/{roomId}/keys/{peerUid}
  │   │   ├─ importPublicKey(peerJwk)
  │   │   ├─ deriveSharedKey(myPrivate, peerPublic) → AES-GCM-256 key
  │   │   └─ Set encryptionReady = true
  │   │
  │   ├─ Step 3: Send Message
  │   │   ├─ encrypt(sharedKey, plaintext) → {iv, ciphertext} (base64)
  │   │   └─ Push to RTDB: chats/{roomId}/messages/{id}
  │   │
  │   └─ Step 4: Receive Message
  │       ├─ subscribeToMessages(roomId) — RTDB onChildAdded
  │       ├─ decrypt(sharedKey, iv, ciphertext) → plaintext
  │       ├─ filterText(plaintext) — profanity filter
  │       └─ Add to messages state
  │
  └─ On "End" click:
      ├─ endChat() → cleanupRoom(roomId) [only for stranger chats]
      └─ navigate('/lobby')
```

### 4. Group Room Flow

```
Create Room:
  User clicks "Start Room" → CreateGroupModal
    ├─ Enter room name
    ├─ createGroup(uid, nickname, name)
    │   ├─ generateRoomCode() → 6-char code (e.g. "X7KM3P")
    │   ├─ Create Firestore: groupChats/{groupId}
    │   │   { name, roomCode, creatorUid, members: [uid], nicknames: {uid: nick} }
    │   └─ Return { groupId, roomCode }
    └─ Show room code → user shares it

Join Room:
  User clicks "Join Room" → JoinGroupModal
    ├─ Enter 6-char room code
    ├─ joinGroupByCode(uid, nickname, roomCode)
    │   ├─ Query groupChats where roomCode == code
    │   ├─ Validate: exists, not full (< 10 members), not already member
    │   ├─ Update: add uid to members[], nickname to nicknames{}
    │   └─ Return { groupId }
    └─ navigate(`/group/${groupId}`)
```

### 5. Group Encryption Flow

```
GroupChatPage mounts
  │
  ├─ useGroupChat initializes
  │   │
  │   ├─ All members: generate ECDH keypair
  │   │   └─ Publish public key to groupChats/{groupId}/memberKeys/{uid}
  │   │
  │   ├─ Creator only (when all keys received):
  │   │   ├─ generateGroupKey() → random AES-256 key
  │   │   ├─ For each member:
  │   │   │   ├─ deriveSharedKey(myPrivate, memberPublic)
  │   │   │   ├─ Encrypt group key with pairwise key
  │   │   │   └─ Write to groupChats/{groupId}/keys/{memberUid}
  │   │   └─ Group key distributed to all members
  │   │
  │   ├─ Non-creator members:
  │   │   ├─ onSnapshot: groupChats/{groupId}/keys/{myUid}
  │   │   ├─ deriveSharedKey(myPrivate, creatorPublic)
  │   │   ├─ Decrypt → group AES key
  │   │   └─ Set encryptionReady = true
  │   │
  │   ├─ Send message:
  │   │   ├─ encrypt(groupKey, plaintext)
  │   │   └─ Push to RTDB: chats/{groupId}/messages/{id}
  │   │       { sender, senderNickname, iv, ciphertext, type: "text" }
  │   │
  │   └─ Receive message:
  │       ├─ decrypt(groupKey, iv, ciphertext)
  │       └─ Show with sender nickname + avatar
  │
  └─ Key Rotation (on member kick/leave):
      ├─ Creator generates NEW group key
      ├─ Re-encrypts for remaining members only
      └─ Increments version number
```

### 6. WebRTC Call Flow (1-on-1)

```
User clicks Audio/Video call button in ChatPage
  │
  ├─ navigate(`/call/${roomId}?peer=${peerUid}&type=${type}`)
  │
  ├─ useWebRTC initializes
  │   │
  │   ├─ getUserMedia({ audio: true, video: type === 'video' })
  │   │   └─ localStream set
  │   │
  │   ├─ Determine role: initiator = (myUid < peerUid)
  │   │
  │   ├─ Create RTCPeerConnection with STUN servers
  │   │   ├─ Add local tracks to connection
  │   │   ├─ ontrack → set remoteStream
  │   │   └─ onicecandidate → write to Firestore
  │   │
  │   ├─ Initiator:
  │   │   ├─ createOffer() → setLocalDescription
  │   │   ├─ Write offer to calls/{callId}
  │   │   ├─ Listen for answer
  │   │   ├─ setRemoteDescription(answer)
  │   │   └─ Listen for answerCandidates
  │   │
  │   └─ Responder:
  │       ├─ Listen for offer
  │       ├─ setRemoteDescription(offer)
  │       ├─ createAnswer() → setLocalDescription
  │       ├─ Write answer to calls/{callId}
  │       └─ Listen for offerCandidates
  │
  └─ Connection established → audio/video flows P2P
```

### 7. Group Call Flow (Mesh WebRTC)

```
User starts group call from GroupChatPage
  │
  ├─ createGroupCall(callId, groupId, uid, type)
  ├─ navigate(`/group-call/${callId}?groupId=${groupId}&type=${type}`)
  │
  ├─ useGroupWebRTC initializes
  │   │
  │   ├─ getUserMedia()
  │   ├─ joinGroupCall(callId, uid) — add to participants[]
  │   │
  │   ├─ listenForGroupCall(callId) — watch participants changes
  │   │
  │   ├─ For EACH other participant:
  │   │   ├─ Create RTCPeerConnection
  │   │   ├─ peerConnections = Map<peerUid, RTCPeerConnection>
  │   │   ├─ Exchange offer/answer via:
  │   │   │   groupCalls/{callId}/signaling/{uidA_uidB}
  │   │   ├─ Exchange ICE via sub-collections
  │   │   └─ remoteStreams = Map<peerUid, MediaStream>
  │   │
  │   └─ Result: N-1 peer connections per user (mesh topology)
  │
  └─ GroupCallGrid renders video tiles for each stream
```

### 8. Watch Together Flow

```
User clicks Watch Together button in ChatPage/GroupChatPage
  │
  ├─ VideoPlayer component renders
  │   ├─ Broadcaster picks a local video file
  │   ├─ <video> element plays the file
  │   ├─ captureStream() captures video element as MediaStream
  │   │
  │   ├─ useVideoStream.startBroadcast(videoElement)
  │   │   └─ Sends captured stream via WebRTC to peer(s)
  │   │
  │   ├─ useVideoSync.startBroadcasting(fileName)
  │   │   └─ Write to Firestore: videoSync/{roomId}
  │   │       { broadcasterUid, fileName, state: "playing", currentTime: 0 }
  │   │
  │   ├─ On play/pause/seek:
  │   │   ├─ publishPlay/publishPause/publishSeek
  │   │   └─ Update Firestore sync state
  │   │
  │   └─ Viewer side:
  │       ├─ useVideoSync subscribes to videoSync/{roomId}
  │       ├─ Receives sync state changes
  │       ├─ useVideoStream receives incoming stream via WebRTC
  │       └─ VideoPlayer renders received stream + syncs controls
  │
  └─ Stop: cleanup Firestore sync doc + stop stream
```

### 9. Friend System Flow

```
User A wants to add User B:
  │
  ├─ User A goes to /friends
  │   ├─ Sees their friend code: "NT-BraveEagle42-a1b2"
  │   └─ Clicks "Add Friend" → enters User B's code
  │
  ├─ AddFriendModal:
  │   ├─ lookupFriendCode(code) → finds User B's UID
  │   └─ sendFriendRequest(fromUid, fromNick, fromCode, toUid)
  │       └─ Write to: friendRequests/{toUid}/pending/{fromUid}
  │
  ├─ User B sees request in FriendsPage:
  │   ├─ FriendRequestItem shows User A's name
  │   └─ Click "Accept":
  │       ├─ acceptFriendRequest() — bilateral write:
  │       │   ├─ friends/{myUid}/list/{friendUid}
  │       │   ├─ friends/{friendUid}/list/{myUid}
  │       │   └─ Delete pending request
  │       └─ Both users now see each other in friends list
  │
  └─ Click friend to chat:
      ├─ createFriendChatRoom(uid1, nick1, uid2, nick2)
      │   └─ Create chatRooms/{roomId} with isFriendChat: true
      └─ navigate(`/chat/${roomId}?peer=${friendUid}&nick=${nick}&friend=1`)
```

---

## Firebase Schema

### Firestore Collections

```
matchQueue/{uid}
  ├── uid: string
  ├── nickname: string
  ├── geohash: string
  ├── lat: number
  ├── lng: number
  ├── radiusKm: number
  ├── status: "searching" | "matched"
  ├── roomId: string (set on match)
  ├── matchedWith: string (peer uid)
  └── joinedAt: Timestamp

chatRooms/{roomId}
  ├── users: [uid1, uid2]
  ├── nicknames: { uid1: "nick1", uid2: "nick2" }
  ├── status: "active" | "ended"
  ├── isFriendChat: boolean
  ├── createdAt: Timestamp
  ├── endedAt: Timestamp
  └── keys/{uid}                          # Sub-collection
      └── publicKey: JWK object

groupChats/{groupId}
  ├── name: string
  ├── roomCode: string (6-char)
  ├── creatorUid: string
  ├── members: [uid1, uid2, ...]          # Max 10
  ├── nicknames: { uid1: "nick1", ... }
  ├── status: "active" | "ended"
  ├── createdAt: Timestamp
  ├── memberKeys/{uid}                    # Sub-collection
  │   └── publicKey: JWK object
  └── keys/{uid}                          # Sub-collection
      ├── encryptedKey: { iv, ciphertext }
      ├── senderUid: string
      └── version: number

calls/{callId}
  ├── callerUid: string
  ├── calleeUid: string
  ├── type: "audio" | "video"
  ├── status: "ringing" | "active" | "ended"
  ├── offer: RTCSessionDescription
  ├── answer: RTCSessionDescription
  ├── createdAt: Timestamp
  ├── offerCandidates/{id}                # Sub-collection
  │   └── (ICE candidate JSON)
  └── answerCandidates/{id}               # Sub-collection
      └── (ICE candidate JSON)

groupCalls/{callId}
  ├── groupId: string
  ├── initiatorUid: string
  ├── type: "audio" | "video"
  ├── participants: [uid1, uid2, ...]
  ├── status: "active" | "ended"
  ├── createdAt: Timestamp
  └── signaling/{uidA_uidB}              # Sub-collection (per peer pair)
      ├── offer: RTCSessionDescription
      ├── answer: RTCSessionDescription
      ├── candidates_a/{id}               # ICE from uid A
      └── candidates_b/{id}               # ICE from uid B

friendCodes/{code}
  ├── uid: string
  ├── nickname: string
  └── createdAt: Timestamp

friendRequests/{toUid}/pending/{fromUid}
  ├── fromUid: string
  ├── fromNickname: string
  ├── fromCode: string
  ├── timestamp: Timestamp
  └── status: "pending"

friends/{myUid}/list/{friendUid}
  ├── nickname: string
  ├── friendCode: string
  ├── addedAt: Timestamp
  └── lastChatAt: Timestamp

blocks/{myUid}/list/{blockedUid}
  └── blockedAt: Timestamp

reports/{reportId}
  ├── reporterUid: string
  ├── reportedUid: string
  ├── roomId: string
  ├── reason: string
  └── timestamp: Timestamp

reportCounts/{uid}
  ├── count: number
  └── lastReportAt: Timestamp

bannedUsers/{uid}
  ├── bannedAt: Timestamp
  └── reason: string

videoSync/{roomId}
  ├── broadcasterUid: string
  ├── fileName: string
  ├── state: "playing" | "paused"
  ├── currentTime: number
  ├── version: number
  └── updatedAt: Timestamp
```

### Realtime Database

```
/chats/{roomId}/messages/{messageId}
  ├── sender: string (uid)
  ├── senderNickname: string (group chats only)
  ├── iv: string (base64)
  ├── ciphertext: string (base64)
  ├── type: "text" | "system" | "videoSync"
  └── timestamp: number (Date.now())
```

---

## Encryption Design

### 1-on-1 Chat Encryption

```
User A                        Firestore                       User B
  │                              │                               │
  ├─ generateKeyPair()           │                               │
  │  (ECDH P-256)                │                               │
  │                              │                               │
  ├─ exportPublicKey(pubA)       │                               │
  ├─ write pubA ──────────────>  │                               │
  │                              │   <────────── write pubB ─────┤
  │                              │                  generateKeyPair()
  │                              │                               │
  ├─ importPublicKey(pubB)       │          importPublicKey(pubA)│
  ├─ deriveSharedKey(privA,pubB) │   deriveSharedKey(privB,pubA)─┤
  │  = sharedKey (AES-256)       │        = sharedKey (same!)    │
  │                              │                               │
  ├─ encrypt(sharedKey, "hi")    │                               │
  │  → {iv, ciphertext}         │                               │
  ├─ send to RTDB ────────────>  │  ──────────> receive ─────────┤
  │                              │        decrypt(sharedKey,iv,ct)│
  │                              │              = "hi"           │
```

### Group Encryption

```
Creator                       Firestore                      Member B
  │                              │                               │
  ├─ generateKeyPair()           │                  generateKeyPair()
  ├─ publish pubKey ───────────> │ <────────── publish pubKey ───┤
  │                              │                               │
  ├─ generateGroupKey()          │                               │
  │  (random AES-256)            │                               │
  │                              │                               │
  ├─ For each member:            │                               │
  │   deriveSharedKey(priv,pubB) │                               │
  │   encrypt(groupKey)          │                               │
  ├─ write encrypted key ──────> │ ─── onSnapshot ──────────────>│
  │   to keys/{memberUid}        │     deriveSharedKey(privB,pubCreator)
  │                              │     decrypt → groupKey        │
  │                              │                               │
  ├─ encrypt("hello", groupKey)  │                               │
  ├─ push to RTDB ─────────────> │ ─── onChildAdded ───────────>│
  │                              │     decrypt(groupKey) = "hello"│

  Key Rotation (on kick/leave):
  ├─ Generate NEW groupKey
  ├─ Re-encrypt for remaining members
  └─ Increment version
```

### Crypto Functions Summary

| Function | Module | Algorithm |
|----------|--------|-----------|
| `generateKeyPair()` | keyManager.js | ECDH P-256 |
| `exportPublicKey(key)` | keyManager.js | JWK export |
| `importPublicKey(jwk)` | keyManager.js | JWK import |
| `deriveSharedKey(priv, pub)` | encryption.js | ECDH → HKDF → AES-GCM-256 |
| `encrypt(key, text)` | encryption.js | AES-256-GCM (random IV) |
| `decrypt(key, iv, ct)` | encryption.js | AES-256-GCM |
| `generateGroupKey()` | groupKeyManager.js | Random AES-256-GCM |
| `encryptGroupKeyForMember()` | groupKeyManager.js | Pairwise ECDH + AES-GCM |
| `decryptGroupKeyFromCreator()` | groupKeyManager.js | Pairwise ECDH + AES-GCM |

---

## File Reference

### Pages (7 files)

| File | Route | Purpose |
|------|-------|---------|
| `LandingPage.jsx` | `/` | Entry page with hero, features, create/join room |
| `LobbyPage.jsx` | `/lobby` | Find strangers, matchmaking dashboard |
| `ChatPage.jsx` | `/chat/:roomId` | 1-on-1 encrypted chat interface |
| `CallPage.jsx` | `/call/:roomId` | Audio/video call with peer |
| `FriendsPage.jsx` | `/friends` | Friends list, requests, group rooms |
| `GroupChatPage.jsx` | `/group/:groupId` | Group encrypted chat with members |
| `GroupCallPage.jsx` | `/group-call/:callId` | Multi-party group call |

### Hooks (12 files)

| Hook | Returns | Purpose |
|------|---------|---------|
| `useAnonymousAuth` | `{user, nickname, friendCode, loading}` | Firebase anonymous login + nickname |
| `useGeolocation` | `{position, geohash, error, loading}` | Browser GPS + geohash |
| `useMatchmaking` | `{status, matchData, startSearching, stopSearching}` | Stranger matching orchestration |
| `useEncryptedChat` | `{messages, sendMessage, encryptionReady, peerDisconnected, endChat}` | 1-on-1 E2E encrypted chat |
| `useGroupChat` | `{messages, sendMessage, sendSystemMessage, encryptionReady, members, nicknames}` | Group E2E encrypted chat |
| `useWebRTC` | `{localStream, remoteStream, callStatus, startCall, endCall, toggleMute, toggleVideo}` | 1-on-1 WebRTC calls |
| `useGroupWebRTC` | `{localStream, remoteStreams, callStatus, endCall, toggleMute, toggleVideo}` | Group mesh WebRTC |
| `useFriends` | `{friends, requests, loading, addByCode, acceptRequest, declineRequest}` | Friend management |
| `useGroups` | `{groups, loading, create, joinByCode, leave, kick}` | Group CRUD |
| `useBlockList` | `{blocked, blockUser, unblockUser}` | Block list management |
| `useRateLimiter` | `{checkLimit}` | Rate limiting wrapper |
| `useVideoSync` | `{syncState, isBroadcaster, publishPlay, publishPause, publishSeek, ...}` | Video playback sync |
| `useVideoStream` | `{isBroadcasting, incomingVideoStream, startBroadcast, stopBroadcast}` | Video stream capture |

### Services (11 files)

| Service | Key Functions |
|---------|--------------|
| `authService.js` | `signInAnonymously`, `onAuthChange` |
| `chatService.js` | `sendEncryptedMessage`, `subscribeToMessages`, `cleanupRoom` |
| `callService.js` | `createCall`, `setOffer`, `setAnswer`, `addCandidate`, `endCall` |
| `matchingService.js` | `joinQueue`, `leaveQueue`, `findMatch`, `listenForMatch` |
| `friendService.js` | `registerFriendCode`, `lookupFriendCode`, `sendFriendRequest`, `acceptFriendRequest` |
| `groupService.js` | `createGroup`, `joinGroupByCode`, `listenForGroups`, `leaveGroup`, `kickMember` |
| `groupCallService.js` | `createGroupCall`, `joinGroupCall`, `setGroupOffer`, `setGroupAnswer` |
| `blockService.js` | `blockUser`, `unblockUser`, `getBlockedLocal`, `syncBlockList` |
| `reportService.js` | `reportUser`, `isBanned` (auto-ban at 5 reports) |
| `videoSyncService.js` | `startVideoSync`, `updateVideoSync`, `stopVideoSync`, `listenForVideoSync` |
| `userService.js` | `registerPresence`, `getNearbyUsers`, `removePresence` |

### Constants (`src/utils/constants.js`)

```
MAX_GROUP_SIZE          = 10
RADIUS_OPTIONS          = [5, 10, 25, 50] km
BAN_THRESHOLD           = 5 reports
RATE_LIMITS.message     = { max: 1, windowMs: 1000 }   (1 msg/sec)
RATE_LIMITS.connection  = { max: 5, windowMs: 60000 }   (5/min)
SUPPORTED_VIDEO_TYPES   = ["mp4", "webm", "ogg"]
VIDEO_SYNC_DEBOUNCE_MS  = 500
ICE_SERVERS             = Google STUN (stun:stun.l.google.com:19302, etc.)
REPORT_REASONS          = [Harassment, Inappropriate Content, Spam, ...]
```

---

## Component Tree

```
App
├── AuthProvider (context)
│
├── LandingPage
│   ├── LandingHero
│   │   └── [Start Chatting] [Start Room] [Join Room]
│   ├── CreateGroupModal (conditional)
│   └── JoinGroupModal (conditional)
│
├── LobbyPage
│   ├── NicknameAvatar
│   ├── RadiusSelector
│   └── SearchingOverlay (conditional)
│       └── [Cancel] button
│
├── ChatPage
│   ├── NicknameAvatar
│   ├── EncryptionBanner
│   ├── VideoPlayer (conditional)
│   ├── MessageList
│   │   └── MessageBubble (per message)
│   ├── ChatInput
│   ├── ReportModal (conditional)
│   └── BlockConfirmModal (conditional)
│
├── CallPage
│   ├── AudioCallUI / VideoCallUI
│   │   └── NicknameAvatar
│   └── CallControls
│
├── FriendsPage
│   ├── FriendCodeCard
│   ├── AddFriendModal (conditional)
│   ├── FriendRequestItem (per request)
│   ├── FriendsList
│   │   └── FriendItem (per friend)
│   ├── GroupListItem (per group)
│   ├── CreateGroupModal (conditional)
│   └── JoinGroupModal (conditional)
│
├── GroupChatPage
│   ├── NicknameAvatar
│   ├── EncryptionBanner
│   ├── MemberList (slide panel)
│   │   └── MemberItem (per member)
│   ├── VideoPlayer (conditional)
│   ├── MessageList
│   │   └── MessageBubble (per message, with sender info)
│   └── ChatInput
│
└── GroupCallPage
    ├── GroupCallGrid
    │   └── VideoTile (per participant)
    │       └── NicknameAvatar (audio placeholder)
    └── CallControls
```

---

## Security & Safety

### Encryption
- **Algorithm**: AES-256-GCM with random 12-byte IV per message
- **Key Exchange**: ECDH P-256, derived via Web Crypto API
- **Group Keys**: Random AES-256, encrypted per-member with pairwise ECDH
- **Key Rotation**: New group key generated when a member is kicked/leaves
- **Zero Knowledge**: Server never sees plaintext — only encrypted ciphertext stored

### Safety Features
- **Profanity Filter**: Leet-speak aware (e.g., `@ss` detected as profanity), replaces with `***`
- **Rate Limiting**: 1 message per second per chat (sliding window)
- **Report System**: 6 categories, auto-ban after 5 reports
- **Block System**: Blocked users excluded from matching, persisted locally + Firebase
- **Anonymous Auth**: No personal data collected, random nicknames only

### WebRTC Security
- **STUN only**: No TURN server, media flows directly P2P
- **DTLS-SRTP**: WebRTC encrypts media streams by default
- **No media servers**: Audio/video never passes through any server

---

## Development

### Setup

```bash
npm install
npm run dev        # Start dev server (localhost + network)
npm run build      # Production build
npm run preview    # Preview production build
```

### Environment Variables (`.env.local`)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

### Firebase Rules (Required)

**Firestore Rules** (test mode):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Realtime Database Rules**:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> Note: These are development rules. For production, implement proper auth-based rules.

### Testing Locally

Open two browser windows (one normal, one incognito) at `http://localhost:5174`. Both will get anonymous auth and can match with each other if location is shared.

---

*Built with React 19 + Firebase + WebRTC + Web Crypto API*

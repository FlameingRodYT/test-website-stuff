import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {useWebSocket} from "../hooks/useWebSocket.js";
import api from "../api/axios.js";

/*
Just for colouring
 */
const FACTION_COLORS = {
    'Rebel Alliance': 'text-orange-400',
    'Galactic Empire': 'text-red-400',
    'Mandalorian': 'text-blue-400',
    'Jedi Order': 'text-green-400',
    'Sith':  'text-purple-400',
    'Neutral': 'text-gray-400'
}
//Avatar colouring flavour shit
const FACTION_AVATAR = {
    'Rebel Alliance': 'bg-orange-950 border-orange-800 text-orange-400',
    'Galactic Empire': 'bg-red-950 border-red-900 text-red-400',
    'Mandalorian':    'bg-blue-950 border-blue-900 text-blue-400',
    'Jedi Order':     'bg-green-950 border-green-900 text-green-400',
    'Sith':           'bg-purple-950 border-purple-900 text-purple-400',
    'Neutral':        'bg-gray-800 border-gray-700 text-gray-400',
}

export default function Chat() {
    /*
    Authentication ifnormation such as username and token
     */
    const { auth, logout, login } = useAuth()
    const navigate = useNavigate()
    //These components coem from the webscoket js
    const { messages, currentRoomId, connected, joinRoom, sendMessage, typingUsers, sendTyping, roomMembersOnline } = useWebSocket()

    const [rooms, setRooms] = useState([])
    const [input, setInput] = useState('')
    const [showCreateRoom, setShowCreateRoom] = useState(false)
    const [newRoom, setNewRoom] = useState({ name: '', description: '', faction: ''})
    const [roomError, setRoomError] = useState('')
    //We need this refrence to persist to know how long the timer is, aka up to 2 seconds
    const typingTimerRef = useRef(null)
    /*
    Scrolling in chat stuff
     */
    const bottomRef = useRef(null)

    //Members of a chat
    const [roomMembers, setRoomMembers] = useState([])
    //Modal view for users
    const [selectedMember, setSelectedMember] = useState(null)
    const [friendError, setFriendError] = useState('')


    //if user isnt logged in or well doesnt have a token, bring ti back
    //basically just a snity hcekc is the user actually have a token
    useEffect(() => {
        if (!auth) {
            api.get('/auth/me')
                .then(res => login(res.data))//login the user
                .catch(() => {})  //logout
        }
    }, [])

    //THis tells us if we belong to a room or not
    const currentRoom = rooms.find(r => r._id === currentRoomId)

    //Fetch rooms on mount
    useEffect(() => {
        api.get('/rooms').then(res => {
            setRooms(res.data);
        })

    }, [])

    useEffect(() => {
        if (!currentRoomId) return
        const room = rooms.find(r => r._id === currentRoomId)
        if(room?.members) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRoomMembers(room.members)
        }

    }, [currentRoomId, rooms])

    //Auto scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleCreateRoom = async () => {
        try {
            const roomData = {
                ...newRoom,
                faction: auth?.faction
            };
            const res = await api.post('/rooms', roomData)
            setRooms(prev => [...prev, res.data])
            setNewRoom({ name: '', description: '', faction: '' })
            setShowCreateRoom(false)
            joinRoom(res.data._id)
            setRoomError('')
        } catch (err) {
            setRoomError(err.response?.data?.error || 'Failed to create room')
        }
    }

    const handleSend = () => {
        if (!input.trim()) return
        sendMessage(input)
        setInput('')

        //We disable sendTyping after a user sends the messahe
        sendTyping(false)
        //Otherwise we clear the timer
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const handleFriendRequest = async () => {
        try {
            const res = await api.patch('/user/friends/request', selectedMember)
            setFriendError('')
        } catch (err) {
            setFriendError(err.response?.data?.error || 'Failed to add friend')
        }
    }

    //This we use to actuallyfor flavour aka we check how many users are typing
    const getTypingText = () => {
        if (typingUsers.length === 0) return null
        if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`
        if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`
        return 'Multiple people are typing...'
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white">

            {/* Sidebar */}
            <div className="w-64 bg-gray-900 flex flex-col border-r border-gray-800">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-blue-600 text-xl font-bold">Holonet</h1>
                    <p className="text-gray-500 text-xs mt-1">
                        {connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </p>
                </div>

                {/* Room list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <p className="text-gray-600 text-xs uppercase tracking-wider px-2 mb-2">Channels</p>
                    {rooms.map(room => (
                        <button
                            key={room._id}
                            onClick={() => joinRoom(room._id)}
                            className={`w-full text-left px-3 py-2 rounded transition text-sm
                ${currentRoomId === room._id
                                ? 'bg-blue-400 text-gray-950 font-bold'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                            # {room.name}
                        </button>
                    ))}
                </div>

                {/* Create room */}
                <div className="p-3 border-t border-gray-800">
                    {showCreateRoom ? (
                        <div className="space-y-2">
                            <input
                                className="w-full bg-gray-800 text-white text-sm p-2 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="Room name"
                                value={newRoom.name}
                                onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                            />
                            <input
                                className="w-full bg-gray-800 text-white text-sm p-2 rounded outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="Description (optional)"
                                value={newRoom.description}
                                onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                            />
                           <input
                               className="w-full bg-gray-800 text-white text-sm p-2 rounded outline-none focus:ring-1 focus:ring-blue-400"
                               value={auth?.faction}
                               disabled
                           />
                            {roomError && <p className="text-red-400 text-xs">{roomError}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateRoom}
                                    className="flex-1 bg-blue-400 text-gray-950 text-sm font-bold py-1.5 rounded hover:bg-blue-300 transition"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => { setShowCreateRoom(false); setRoomError('') }}
                                    className="flex-1 bg-gray-800 text-gray-400 text-sm py-1.5 rounded hover:bg-gray-700 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreateRoom(true)}
                            className="w-full text-gray-500 hover:text-blue-400 text-sm py-1.5 transition text-left px-2"
                        >
                            + New Channel
                        </button>
                    )}
                </div>

                {/* User info */}
                <div className="p-4 border-t border-gray-800 flex justify-between items-center">
                    <div
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 transition cursor-pointer flex-1 min-w-0"
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${FACTION_AVATAR[auth?.faction]}`}>
                            {auth?.username?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{auth?.username}</p>
                            <p className={`text-xs ${FACTION_COLORS[auth?.faction]}`}>{auth?.faction}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-400 text-xs transition ml-2 shrink-0"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {currentRoom ? (
                    <>
                        {/* Room header */}
                        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
                            <h2 className="text-white font-bold"># {currentRoom.name}</h2>
                            <p className="text-gray-500 text-sm">{currentRoom.description}</p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {messages.length === 0 && (
                                <p className="text-gray-600 text-sm">No transmissions yet. Break the silence.</p>
                            )}
                            {messages.map((msg, i) => (
                                <div key={msg._id || i}>
                                    <div className="flex items-baseline gap-2">
                    <span className={`font-bold text-sm ${FACTION_COLORS[msg.faction]}`}>
                      {msg.username}
                    </span>
                                        <span className="text-gray-600 text-xs">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                                    </div>
                                    <p className="text-gray-200 mt-0.5">{msg.content}</p>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                            {/* Here we display when a user is typing*/}
                            <div className="px-6 h-6 flex items-center">
                                {getTypingText() && (
                                    <p className="text-gray-500 text-xs italic">{getTypingText()}</p>
                                )}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900 flex gap-3">
                            <input
                                className="flex-1 bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                placeholder={`Message #${currentRoom.name}...`}
                                value={input}
                                onChange={e => {
                                    //This is the classical thing no need to explain
                                    setInput(e.target.value)

                                    //We inform that a user is typing
                                    sendTyping(true)

                                    //We set the timer to 0 if current
                                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

                                    //If the user hasnt typed, after 2 seconds it stops
                                    typingTimerRef.current = setTimeout(() => {
                                        sendTyping(false)
                                    }, 2000)
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                className="bg-blue-400 text-gray-950 font-bold px-5 rounded hover:bg-blue-300 transition text-sm"
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <p className="text-gray-400 text-lg">Welcome to the Holonet</p>
                            <p className="text-gray-600 text-sm mt-2">Select a channel to begin transmission</p>
                        </div>
                    </div>
                )}
            </div>
            {/* Members Panel */}
            <div className="w-48 bg-gray-900 border-l border-gray-800 flex flex-col">
                <div className="px-3 py-3 border-b border-gray-800">
                    <p className="text-gray-600 text-xs uppercase tracking-widest font-mono">Holocomm</p>
                    <p className="text-gray-700 text-xs font-mono mt-0.5">{roomMembersOnline.length} online</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                    {['supreme_commander', 'commander', 'member'].map(role => {
                        const group = roomMembers.filter(m => m.role === role)
                        if (group.length === 0) return null

                        const roleLabel = {
                            supreme_commander: 'Supreme Commander',
                            commander: 'Commander',
                            member: 'Member',
                        }[role]

                        const roleLabelColor = {
                            supreme_commander: 'text-yellow-400',
                            commander: 'text-purple-400',
                            member: 'text-gray-500',
                        }[role]

                        return (
                            <div key={role}>
                                <p className={`text-5xl uppercase tracking-wider px-2 pt-2 pb-1 font-mono ${roleLabelColor}`}
                                   style={{ fontSize: '10px' }}>
                                    {roleLabel} — {group.length}
                                </p>
                                {group.map(member => {
                                    const isOnline = roomMembersOnline.some(o => o.username === member.user.username)
                                    return (
                                        <div
                                            key={member.user._id}
                                            onClick={() => setSelectedMember(member)}
                                            className="flex items-center gap-2 px-4 py-1.5 rounded hover:bg-gray-800 transition cursor-default"
                                        >
                                            <div className="relative shrink-0">
                                                {member.user.avatarUrl
                                                    ? <img src={member.user.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                                                    : <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border 
                        ${FACTION_AVATAR[member.user.faction]} ${!isOnline ? 'opacity-40' : ''}`}>
                                                        {member.user.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                }
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-gray-900 
                      ${isOnline ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-gray-300 text-xs font-medium truncate">{member.user.username}</p>
                                                <p className={`text-xs truncate ${FACTION_COLORS[member.user.faction]}`}
                                                   style={{ fontSize: '10px', opacity: 0.7 }}>
                                                    {isOnline ? member.user.faction : 'Offline'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
            {/* Member Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                     onClick={() => setSelectedMember(null)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-80 overflow-hidden shadow-2xl"
                         onClick={e => e.stopPropagation()}>

                        {/* Banner + Avatar */}
                        <div className="h-20 bg-gradient-to-r from-gray-800 to-gray-700 relative">
                            {selectedMember.user.avatarUrl
                                ? <img
                                    src={selectedMember.user.avatarUrl}
                                    className="absolute -bottom-8 left-5 w-16 h-16 rounded-full object-cover border-4 border-gray-900"
                                />
                                : <div className={`absolute -bottom-8 left-5 w-16 h-16 rounded-full border-4 border-gray-900 flex items-center justify-center text-xl font-bold ${FACTION_AVATAR[selectedMember.user.faction]}`}>
                                    {selectedMember.user.username.slice(0, 2).toUpperCase()}
                                </div>
                            }
                        </div>

                        {/* Close button */}
                        <div className="flex justify-end px-4 pt-2">
                            <button onClick={() => setSelectedMember(null)}
                                    className="text-gray-400 hover:text-white text-sm font-medium transition px-2 py-1 rounded hover:bg-gray-800">
                                ✕ close
                            </button>
                        </div>

                        {/* Info */}
                        <div className="px-5 pt-6 pb-5 space-y-3">
                            <div>
                                <p className="text-white font-bold text-lg leading-tight">{selectedMember.user.username}</p>
                                <p className={`text-sm ${FACTION_COLORS[selectedMember.user.faction]}`}>{selectedMember.user.faction}</p>
                            </div>

                            <div className="border-t border-gray-800 pt-3 space-y-1">
                                <p className="text-gray-600 text-xs uppercase tracking-wider">Member since</p>
                                <p className="text-gray-400 text-sm">—</p>
                            </div>

                            {auth?.username !== selectedMember.user.username && (
                                <div className="border-t border-gray-800 pt-3">
                                    <button
                                        onClick={handleFriendRequest}
                                        className="w-full bg-blue-900/40 text-blue-400 border border-blue-800 text-xs py-2 rounded hover:bg-blue-900/70 transition font-medium"
                                    >
                                        + Add Friend
                                    </button>
                                    {friendError && <p className="text-red-400 text-xs">{friendError}</p>}
                                </div>
                            )}

                            {/* Admin actions placeholder — wire up later */}
                            {auth?.role === 'admin' && (
                                <div className="border-t border-gray-800 pt-3 flex gap-2">
                                    <button className="flex-1 bg-yellow-900/40 text-yellow-400 border border-yellow-800 text-xs py-1.5 rounded hover:bg-yellow-900/70 transition">
                                        Kick
                                    </button>
                                    <button className="flex-1 bg-red-900/40 text-red-400 border border-red-800 text-xs py-1.5 rounded hover:bg-red-900/70 transition">
                                        Ban
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
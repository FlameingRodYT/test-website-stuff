import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from "../api/axios.js";

export const useWebSocket = () => {
    const { auth } = useAuth() //this is our authentication context, basically how we keep the user logged in or lpgged out
    const wsRef = useRef(null) //ws thing
    const [messages, setMessages] = useState([]) //ourmessages wesebd
    const [currentRoomId, setCurrentRoomId] = useState(null) //where we at
    const [connected, setConnected] = useState(false) //are we alive
    const [typingUsers, setTypingUsers] = useState([]) //who is typing
    const [roomMembersOnline, setRoomMembersOnline] = useState([]) //who is online

    useEffect(() => {
        if (!auth) return;

        let ws;

        const connect = async () => {
            //I presume user data
            const {data} = await api.get('/auth/ws-ticket')
            //protocol required for the browser to recognise what happens
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            //We use the protocol, aka we tell what we connect and where as well as with what content
            const wsUrl = import.meta.env.VITE_WS_URL ||
                `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}:11062`
            ws = new WebSocket(wsUrl)
            //we refrence it for each user ot enable seamless transition
            wsRef.current = ws

            //WS on open just checks if you are connected to the websocket -> wella ctually htis is how we sign and authenticate the WBE SOCKET
            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'auth', token: data.ticket }))
                setConnected(true)
                console.log('WS connected')
            }
            //Wehn on message eventt is triggered we grab the message data
            ws.onmessage = (event) => {
                //we require the data in JSON format for ease of usage and then distribute it
                const data = JSON.parse(event.data)

                if (data.type === 'presence') {
                    setRoomMembersOnline(data.users);
                    return;
                }

                //We get and send a new data type, kaka typing
                if (data.type === 'typing') {
                    //We gather from the username who types, includes is our filter + we add more if mor eusers are typing
                    setTypingUsers(prev =>
                        prev.includes(data.username) ? prev : [...prev, data.username]
                    )
                } else if (data.type === 'stopTyping') {
                    //we remove the users if theystop typing
                    setTypingUsers(prev => prev.filter(u => u !== data.username))
                }

                //Our messages are stroed in different formats, current and history, history are obviously all other messages, current is the one we sent
                if (data.type === 'history') {
                    //Fresh history for newly joined room - replace messages
                    setMessages(data.messages)
                    //We set the current roomId to the one we have joined
                    setCurrentRoomId(data.roomId)
                    //the history users arent typing hence why its empty (we do this otherwise joining users might be mistaken as typers)
                    setTypingUsers([])
                } else if (data.type === 'message') {
                    //This are all thew other/ real time messages coming from the user -> this is used across the enitere chatroom website as multiple websites can be opened
                    setMessages(prev => [...prev, data.message])
                }
            }

            //Visual only but we show that the user might potentially have disconnected
            ws.onclose = () => {
                setConnected(false)
                console.log('WS disconnected, retrying...');
                setTimeout(connect, 2000)
            }
            //potential for cahnge -> myb a more concrete error messahe
            ws.onerror = (e) => console.error('WS error', e)

        };

        //We separated this in a function, for tnhe reason to make it clean and for the connection start to be obvios and reconnection ish logic
        connect();

        return () => ws?.close()
    }, [auth]) //this is a dpenedency array, our useEffect will cahnge once our auth, aka zuser, changes somethign with this parameter

    //This method as well can be used in multiple area
    //We grab the roomId and connect the user to it in the backend
    const joinRoom = (roomId) => {
        //We first check if the state is ready for ws, if it is, then we can connect to a room
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            setMessages([]) //clear messages immediately on room switch
            //We send a string to our backend infoming it we want to join a new room wiht the room id
            wsRef.current.send(JSON.stringify({ type: 'join', roomId }))
        }
    }
//Content of a message iss ent to a backend via this method
    const sendMessage = (content) => {
        //once again we check if our wsRef aka webscoket is connected and if the contetn has any spaces at the end
        if (wsRef.current?.readyState === WebSocket.OPEN && content.trim()) {
            //same as above, we send a strigfy json to our backend
            wsRef.current.send(JSON.stringify({ type: 'message', content }))
        }
    }
    //This is our method that actually send the proper users and type of message
    const sendTyping = (isTyping) => {
        //we check first if the webSocket is open
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            //If yes -> send a string to ws to well distribute all the datat to all our users
            //we send typing or stopTyping depending on the context
            wsRef.current.send(JSON.stringify({
                type: isTyping ? 'typing' : 'stopTyping'
            }))
        }
    }

    //exporting all the importante components
    return { messages, currentRoomId, connected, joinRoom, sendMessage, typingUsers, sendTyping, roomMembersOnline }
}
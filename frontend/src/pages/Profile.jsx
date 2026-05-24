import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from "../api/axios.js";
import { useAuth } from '../context/AuthContext'

const FACTIONS = ['Rebel Alliance', 'Galactic Empire', 'Mandalorian', 'Jedi Order', 'Sith', 'Neutral']

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

export default function Profile() {

    const { auth, login } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('profile')
    const [editUser, setEditUser] = useState({username: '', faction: ''})
    const [userError, setUserError] = useState('')
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' })
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [friendRequests, setFriendRequests] = useState([])
    const [friendRequestsError, setFriendRequestsError] = useState('')
    const [friends, setFriends] = useState([])
    const [friendsError, setFriendsError] = useState('')

    useEffect(() => {
        if (!auth) navigate('/')

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditUser({username: auth?.username, faction: auth?.faction})
    }, [auth, navigate])

    useEffect(() => {
        api.get('/user/me/friendRequests')
            .then(res =>{
                setFriendRequests(res.data)
            } )
            .catch(() => setFriendRequestsError('Failed to load friend requests'))
        api.get('/user/me/friends')
            .then(res => setFriends(res.data))
            .catch(() => setFriendsError('Failed to load friends'))
    }, [])

    const handleGoingBack = () => {
        navigate('/chat');
    }

    const handleChange = async () => {
        try {
            setUserError('')
            const res = await api.patch('/user/me', editUser)
            setEditUser(res.data)
            //Update the user information -> DONT OVERWRITE
            login({
                ...auth,
                username: res.data.username,
                faction: res.data.faction
            })

        } catch (err) {
            setUserError(err.response?.data?.error || 'Failed to create room')
        }
    }

    const handlePasswordChange = async () => {
        try {
            setPasswordError('')
            setPasswordSuccess('')
            await api.patch('/user/me/password', passwordData)
            setPasswordSuccess('Password updated successfully')
            setPasswordData({ oldPassword: '', newPassword: '' })
            setTimeout(() => setPasswordSuccess(''), 3000)
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to update password')
        }
    }

    const handleAccept = async (userId) => {
        try {
            await api.patch('/user/friends/request/accept', { id: userId})
            setFriendRequests(prev => prev.filter(r => r.user._id !== userId))
        } catch (err) {
            setFriendRequestsError(err.response?.data?.error || 'Failed to accept request')
        }
    }

    const handleDecline = async (userId) => {
        try {
            await api.patch('/user/friends/request/delete', { data: { id: userId} })
            setFriendRequests(prev => prev.filter(r => r.user._id !== userId))
        } catch (err) {
            setFriendRequestsError(err.response?.data?.error || 'Failed to decline request')
        }
    }

    const handleRemoveFriend = async (userId) => {
        try {
            await api.patch('/user/friends/remove', { id: userId })
            setFriends(prev => prev.filter(f => f._id.toString() !== userId.toString()))
        } catch (err) {
            setFriendsError(err.response?.data?.error || 'Failed to remove friend')
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const res = await api.patch('/user/me/avatar', formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            })
            login({...auth, avatarUrl: res.data.avatarUrl})
        } catch (err) {
            console.error('Avatar upload failed', err)
        }
    }


    return (
        <div className="min-h-screen bg-gray-950 text-white flex justify-center items-start py-10">
            <div className="w-full max-w-3xl bg-gray-900 rounded-xl border border-gray-800 shadow-lg">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-blue-400">Profile Settings</h1>
                    <button className="text-sm text-gray-400 hover:text-white transition"
                            onClick={handleGoingBack}>
                        Back
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 px-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`text-sm py-3 pr-6 font-medium transition border-b-2 ${
                            activeTab === 'profile'
                                ? 'border-blue-400 text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}>
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('friend request')}
                        className={`text-sm py-3 pr-6 font-medium transition border-b-2 ${
                            activeTab === 'friend request'
                                ? 'border-blue-400 text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}>
                        Friend Requests
                        {friendRequests.length > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {friendRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`text-sm py-3 pr-6 font-medium transition border-b-2 ${
                            activeTab === 'friends'
                                ? 'border-blue-400 text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}>
                        Friend
                        {friends.length > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {friends.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="p-6 space-y-8">

                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div
                                className="relative group w-24 h-24 rounded-full cursor-pointer flex-shrink-0"
                                onClick={() => document.getElementById('avatarInput').click()}
                            >
                                {auth?.avatarUrl
                                    ? <img src={auth.avatarUrl} className="w-24 h-24 rounded-full object-cover border border-gray-700" />
                                    : <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold border border-gray-700">
                                        {auth?.username?.slice(0, 1).toUpperCase()}
                                    </div>
                                }
                                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-gray-300 transition pointer-events-none">
                                    Change
                                </div>
                                <input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">Edit your avatar</p>
                                <p className="text-sm text-gray-500">Click to upload a new profile picture</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-800" />

                        {/* Form */}
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Username</label>
                                <input
                                    value={editUser.username}
                                    onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                                    className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                    placeholder="Enter new username"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Faction</label>
                                <select
                                    value={editUser.faction}
                                    onChange={(e) => setEditUser({ ...editUser, faction: e.target.value })}
                                    className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                >
                                    {FACTIONS.map(f => <option key={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>

                        {userError && <p className="text-red-400 text-xs">{userError}</p>}

                        <div className="border-t border-gray-800" />

                        {/* Password Section */}
                        <div>
                            <button
                                onClick={() => {
                                    setShowPasswordForm(p => !p)
                                    setPasswordError('')
                                    setPasswordSuccess('')
                                    setPasswordData({ oldPassword: '', newPassword: '' })
                                }}
                                className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
                            >
                                <span>{showPasswordForm ? '▾' : '▸'}</span>
                                Change Password
                            </button>

                            {showPasswordForm && (
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.oldPassword}
                                            onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                                    {passwordSuccess && <p className="text-emerald-400 text-xs">{passwordSuccess}</p>}
                                    <button
                                        onClick={handlePasswordChange}
                                        className="bg-blue-400 text-gray-950 font-bold px-5 py-2 rounded hover:bg-blue-300 transition text-sm"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-800" />

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <button
                                className="bg-blue-400 text-gray-950 font-bold px-6 py-2 rounded hover:bg-blue-300 transition text-sm"
                                onClick={handleChange}>
                                Save Changes
                            </button>
                            <button className="text-red-500 hover:text-red-400 text-sm transition">
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}

                {/* Friend Requests Tab */}
                {activeTab === 'friend request' && (
                    <div className="p-6 space-y-3">
                        {friendRequestsError && (
                            <p className="text-red-400 text-xs">{friendRequestsError}</p>
                        )}

                        {friendRequests.length === 0 && !friendRequestsError && (
                            <div className="text-center py-16">
                                <p className="text-gray-500 text-sm">No pending friend requests</p>
                                <p className="text-gray-700 text-xs mt-1">When someone sends you a request it will appear here</p>
                            </div>
                        )}

                        {friendRequests.map(friend => (
                            <div key={friend.user._id}
                                 className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">

                                {/* Avatar + info */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${FACTION_AVATAR[friend.user.faction]}`}>
                                        {friend.user.username.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{friend.user.username}</p>
                                        <p className={`text-xs ${FACTION_COLORS[friend.user.faction]}`}>{friend.faction}</p>
                                    </div>
                                </div>

                                {/* Accept / Decline */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleAccept(friend.user._id)}
                                        className="w-8 h-8 rounded-full bg-emerald-900/40 border border-emerald-700 text-emerald-400 hover:bg-emerald-900/80 transition flex items-center justify-center text-sm"
                                        title="Accept"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => handleDecline(friend.user._id)}
                                        className="w-8 h-8 rounded-full bg-red-900/40 border border-red-800 text-red-400 hover:bg-red-900/80 transition flex items-center justify-center text-sm"
                                        title="Decline"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'friends' && (
                    <div className="p-6 space-y-3">
                        {friendsError && (
                            <p className="text-red-400 text-xs">{friendsError}</p>
                        )}
                        {friends.length === 0 && !friendsError && (
                            <div className="text-center py-16">
                                <p className="text-gray-500 text-sm">No friends yet</p>
                                <p className="text-gray-700 text-xs mt-1">Accept a friend request to get started</p>
                            </div>
                        )}
                        {friends.map(friend => (
                            <div key={friend.user._id}
                                 className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${FACTION_AVATAR[friend.user.faction]}`}>
                                        {friend.user.username.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{friend.user.username}</p>
                                        <p className={`text-xs ${FACTION_COLORS[friend.user.faction]}`}>{friend.user.faction}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFriend(friend.user._id)}
                                    className="text-xs text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition"
                                    title="Remove friend">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from "../api/axios.js";
import { useAuth } from '../context/AuthContext'

const FACTIONS = ['Rebel Alliance', 'Galactic Empire', 'Mandalorian', 'Jedi Order', 'Sith', 'Neutral']

export default function Profile() {

    const { auth, login } = useAuth()
    const navigate = useNavigate()
    const [editUser, setEditUser] = useState({username: '', faction: ''})
    const [userError, setUserError] = useState('')
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' })
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')

    useEffect(() => {
        if (!auth) navigate('/')

        setEditUser({username: auth?.username, faction: auth?.faction})
    }, [auth])

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

    return(
        <div className="min-h-screen bg-gray-950 text-white flex justify-center items-start py-10">
            <div className="w-full max-w-3xl bg-gray-900 rounded-xl border border-gray-800 shadow-lg">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-blue-400">Profile Settings</h1>
                    <button className="text-sm text-gray-400 hover:text-white transition"
                    onClick={() => handleGoingBack()}
                    >
                        Back
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {/* Avatar circle */}
                            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold cursor-pointer border border-gray-700 group-hover:border-blue-400 transition">
                                U
                            </div>

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-gray-300 transition cursor-pointer">
                                Change
                            </div>
                        </div>

                        <div>
                            <p className="text-lg font-semibold">Edit your avatar</p>
                            <p className="text-sm text-gray-500">
                                Click the circle to upload a new profile picture
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-800" />

                    {/* Form */}
                    <div className="space-y-5">

                        {/* Username */}
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">
                                Username
                            </label>
                            <input
                                value={editUser.username}
                                onChange={(e) =>
                                    setEditUser({ ...editUser, username: e.target.value })
                                }
                                className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                placeholder="Enter new username"
                            />
                        </div>

                        {/* Faction */}
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">
                                Faction
                            </label>

                            <select
                                value={editUser.faction}
                                onChange={(e) =>
                                    setEditUser({ ...editUser, faction: e.target.value })
                                }
                                className="w-full bg-gray-800 text-white p-3 rounded outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            >
                                {FACTIONS.map(f => (
                                    <option key={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    </div>
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

                    {/* Divider */}
                    <div className="border-t border-gray-800" />

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                        <button className="bg-blue-400 text-gray-950 font-bold px-6 py-2 rounded hover:bg-blue-300 transition text-sm"
                        onClick={() => handleChange()}
                        >
                            Save Changes
                        </button>

                        <button className="text-red-500 hover:text-red-400 text-sm transition">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
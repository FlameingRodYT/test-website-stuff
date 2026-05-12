import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

const FACTIONS = ['Rebel Alliance', 'Galactic Empire', 'Mandalorian', 'Jedi Order', 'Sith', 'Neutral']

export default function Register() {
    const [form, setForm] = useState({ username: '', password: '', faction: 'Neutral' })
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async () => {
        try {
            /*
            We post the user to our backend and hope that he correctly registeres
             */
            const res = await api.post('/auth/register', form)
            /*
            We dont forget our payload data we assign that to auth, becuz auth will be used across our website
             */
            sessionStorage.setItem('user', JSON.stringify(res.data))
            /*
            Our login "method" where we send the user data
             */
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
        }
    }
    /*
    One super improtant thing here is our option tab which is done via StreamingAPI
     */
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
                <h1 className="text-blue-600 text-3xl font-bold mb-2">Holonet</h1>
                <p className="text-gray-400 mb-6">Join a faction. Begin your transmission.</p>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                <input
                    className="w-full bg-gray-800 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                />
                <input
                    type="password"
                    className="w-full bg-gray-800 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                />

                <select
                    className="w-full bg-gray-800 text-white p-3 rounded mb-6 outline-none focus:ring-2 focus:ring-blue-400"
                    value={form.faction}
                    onChange={e => setForm({ ...form, faction: e.target.value })}
                >
                    {FACTIONS.map(f => <option key={f}>{f}</option>)}
                </select>

                <button
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    onClick={handleSubmit}
                    className="w-full bg-blue-400 text-gray-950 font-bold p-3 rounded hover:bg-blue-300 transition"
                >
                    Join the Holonet
                </button>

                <p className="text-gray-400 mt-4 text-center">
                    Already have an account? <Link to="/" className="text-blue-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    )
}
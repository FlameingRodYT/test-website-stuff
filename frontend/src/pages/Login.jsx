import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '' })
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async () => {
        try {
            const res = await api.post('/auth/login', form)
            login(res.data)
            navigate('/chat')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
                <h1 className="text-blue-600 text-3xl font-bold mb-2">Holonet</h1>
                <p className="text-gray-400 mb-6">Sign in to continue</p>

                {error && <p className="text-red-400 mb-4">{error}</p>}

                <input
                    className="w-full bg-gray-800 text-white p-3 rounded mb-3 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                />
                <input
                    type="password"
                    className="w-full bg-gray-800 text-white p-3 rounded mb-6 outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                />

                <button
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    onClick={handleSubmit}
                    className="w-full bg-blue-400 text-gray-950 font-bold p-3 rounded hover:bg-blue-300 transition"
                >
                    Login
                </button>

                <p className="text-gray-400 mt-4 text-center">
                    No account? <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    )
}
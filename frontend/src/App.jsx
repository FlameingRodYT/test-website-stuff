import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import { useAuth } from './context/AuthContext'
import Profile from "./pages/Profile";

const ProtectedRoute = ({ children }) => {
    const { auth } = useAuth()
    return auth ? children : <Navigate to="/" />
}
/*
These are our actual routes of the app, in our case we have only 3 (login, register and caht,)
Chat is a protected route and can only be accessed IF you logged in
 */
export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
    )
}
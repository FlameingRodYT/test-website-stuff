import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    //straightforward -> we get our user data this way
    const [auth, setAuth] = useState(() => {
        return JSON.parse(sessionStorage.getItem('user') || 'null')
    })

    //Our login is just us setting the user data in session
    const login = (data) => {
        sessionStorage.setItem('user', JSON.stringify(data))
        setAuth(data)
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            sessionStorage.removeItem('user')
            setAuth(null)
        }
    }

    //{children} is needed to well parse children in our case that might be App.Jsx or main,jsx
    //nbasically means all the children of AuthProvider have access to auth, login and logout methods
    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
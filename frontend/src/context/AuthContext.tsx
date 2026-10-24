import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import { authService } from '../services/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  username: string
  password: string
  full_name?: string
  role?: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const me = await authService.getMe(savedToken)
          setUser(me)
          setToken(savedToken)
        } catch {
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    const me = await authService.getMe(data.access_token)
    setUser(me)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    await authService.register(data)
    await login(data.email, data.password)
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

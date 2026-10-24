import axios from 'axios'
import { User } from '../types'

const BASE = '/api/auth'

export const authService = {
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const res = await axios.post(`${BASE}/login`, { email, password })
    return res.data
  },

  async register(data: {
    email: string
    username: string
    password: string
    full_name?: string
    role?: string
  }): Promise<User> {
    const res = await axios.post(`${BASE}/register`, data)
    return res.data
  },

  async getMe(token: string): Promise<User> {
    const res = await axios.get(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}

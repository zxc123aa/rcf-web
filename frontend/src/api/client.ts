import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export default client

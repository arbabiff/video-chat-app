import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminLogin from './components/AdminLogin'

const root = document.getElementById('root')
if (!root) throw new Error('Admin root not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AdminLogin />
  </React.StrictMode>
)

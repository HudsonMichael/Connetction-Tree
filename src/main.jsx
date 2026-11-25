import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PinGate from './PinGate.jsx'
import './style.css'
createRoot(document.getElementById('root')).render(<PinGate><App /></PinGate>)

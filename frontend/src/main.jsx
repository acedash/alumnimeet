import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import './index.css'
import App from './App.jsx'
import { ChatProvider } from './context/chatContext.jsx'

createRoot(document.getElementById('root')).render(
   <React.StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </React.StrictMode>
)

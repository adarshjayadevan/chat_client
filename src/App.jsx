import { useState } from 'react'
// import './App.css'
import ChatApp from './Chat/Chat'
import { Login } from './Auth/Login'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './Auth/Auth';

function App() {

  return (
    <>

      <Router>
        <Routes>
          <Route
            path='/login'
            element={
              <Login />
            } />
          <Route
            path='/'
            element={
              <Auth>
                <ChatApp />
              </Auth>
            } />
        </Routes>
      </Router>
    </>
  )
}

export default App

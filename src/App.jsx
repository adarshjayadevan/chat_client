import { useState } from 'react'
// import './App.css'
import ChatApp from './Chat/Chat'
import { Login } from './Auth/Login'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './Auth/Auth';
import { Register } from './Auth/Register';

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
            path='/register'
            element={
              <Register />
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

import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';

// imports
import { AuthContextProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProctetedRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AuthContextProvider>
              <Navbar />
            </AuthContextProvider>
          }
        >
          <Route
            path="chats/"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

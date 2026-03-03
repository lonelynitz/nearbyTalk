import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import CallPage from './pages/CallPage';
import GroupChatPage from './pages/GroupChatPage';
import GroupCallPage from './pages/GroupCallPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="app">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/chat/:roomId" element={<ChatPage />} />
              <Route path="/call/:roomId" element={<CallPage />} />
              <Route path="/group/:groupId" element={<GroupChatPage />} />
              <Route path="/group-call/:callId" element={<GroupCallPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

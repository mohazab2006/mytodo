import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initDatabase } from './db/client';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import SchoolPage from './pages/SchoolPage';
import LifePage from './pages/LifePage';

function App() {
  useEffect(() => {
    // Initialize database on app load
    initDatabase().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="upcoming" element={<UpcomingPage />} />
          <Route path="school" element={<SchoolPage />} />
          <Route path="life" element={<LifePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


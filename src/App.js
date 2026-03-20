import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import NavBar from './components/layout/NavBar';
import DashboardPage from './pages/DashboardPage';
import MatrixPage from './pages/MatrixPage';
import TraineesPage from './pages/TraineesPage';
import PositionsPage from './pages/PositionsPage';
import TrainersPage from './pages/TrainersPage';
import PathsPage from './pages/PathsPage';

function App() {
  return (
    <div className="appLayout">
      <NavBar />
      <main className="appMain">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/matrix" element={<MatrixPage />} />
          <Route path="/trainees" element={<TraineesPage />} />
          <Route path="/trainers" element={<TrainersPage />} />
          <Route path="/paths" element={<PathsPage />} />
          <Route path="/positions" element={<PositionsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

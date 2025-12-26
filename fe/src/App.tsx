import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import authStore from "./modules/stores/AuthStore";

// Example protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return authStore.isAuthenticated ? (
        <>{children}</>
    ) : (
        <Navigate to="/register" replace />
    );
};

// Example dashboard component
const Dashboard: React.FC = () => {
    const handleLogout = () => {
        authStore.logout();
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4">Welcome! You are logged in.</p>
            <button
                onClick={handleLogout}
                className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Logout
            </button>
        </div>
    );
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/register" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
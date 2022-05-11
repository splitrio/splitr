import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import Login from './routes/login';
import Dashboard from './routes/dashboard';
import Expense from './routes/expense/expense';

import './App.scss';
import { Toaster } from 'react-hot-toast';
import useAuth, { AuthProvider } from './hooks/useAuth';

function RequireAuth({ loginPath }) {
    const auth = useAuth();
    const location = useLocation();
    if (!auth.authenticated())
        return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
    else return <Outlet />;
}

export default function App() {
    // Set global document title
    document.title = "splitr";
    const location = useLocation();

    return (
        <AuthProvider>
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login />} />
                <Route element={<RequireAuth loginPath='/login' />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/expense" element={<Expense />} />
                </Route>
                <Route path='*' element={<Navigate to='/' />} />
            </Routes>
            <Toaster position='bottom-center' />
        </AuthProvider>
    );
}

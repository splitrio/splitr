import { Routes, Route, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Login from './routes/login';
import Dashboard from './routes/dashboard';
import Expense from './routes/expense';

import './App.scss';

export default function App() {
    // Set global document title
    document.title = "splitr";
    const location = useLocation();

    return (
        <TransitionGroup component={null}>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
                <Routes location={location}>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/expense" element={<Expense />} />
                </Routes>
            </CSSTransition>
        </TransitionGroup>
    );
}

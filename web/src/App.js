import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './routes/login';
import Dashboard from './routes/dashboard';
import Expense from './routes/expense';

import './App.scss';

export default function App() {
    return (
        <div id="content">
            <nav className="container-fluid">
                <ul>
                    <li><a href="./" className="contrast" onClick={event => event.preventDefault()}><strong>splitr</strong></a></li>
                </ul>
            </nav>

            <main id="pageContainer" className="container">
                <article className="grid">
                    <div id="page">
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<Login />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/expense" element={<Expense />} />
                            </Routes>
                        </BrowserRouter>
                    </div>
                </article>
            </main>

            <footer className="container-fluid">
                <small>Built with <a href="https://picocss.com" className="secondary">Pico</a></small>
            </footer>
        </div>
    );
}

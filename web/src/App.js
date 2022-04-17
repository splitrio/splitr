import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './routes/login';

import './App.scss';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login/>}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;

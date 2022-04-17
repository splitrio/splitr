import { useTitle } from "../hooks"
import { FaReceipt, FaPlus } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    useTitle("Welcome");
    const navigate = useNavigate();
    return (
        <>
            <hgroup>
                <h1 className="title">Welcome</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
            <div className="grid">
                <button className="contrast"><FaReceipt /> Scan Receipt</button>
                <button className="contrast" onClick={() => navigate('/expense')}><FaPlus /> Other Expense</button>
            </div>
        </>
    )
}
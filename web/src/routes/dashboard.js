import { FaReceipt, FaPlus } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import Page from '../components/Page';

export default function Dashboard() {
    const navigate = useNavigate();
    return (
        <Page>
            <hgroup>
                <h1 className="title">Welcome</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
            <div className="grid">
                <button className="contrast"><FaReceipt /> Scan Receipt</button>
                <button className="contrast" onClick={() => navigate('/expense')}><FaPlus /> Other Expense</button>
            </div>
        </Page>
    )
}
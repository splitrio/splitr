import { useTitle } from "../hooks"
import { FaReceipt, FaPlus } from 'react-icons/fa';

export default function Dashboard() {
    useTitle("Welcome");
    return (
        <>
            <hgroup>
                <h1 className="title">Welcome to splitr</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
            <div className="grid">
                <button><FaReceipt /> Scan Receipt</button>
                <button className="secondary"><FaPlus /> Other Transaction</button>
            </div>
        </>
    )
}
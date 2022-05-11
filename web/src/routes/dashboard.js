import { useEffect, useState } from 'react';
import { FaReceipt, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import Page from '../components/Page';
import useAuth from '../hooks/useAuth';

import './login.scss';

export default function Dashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    useEffect(() => {
        async function fetchExpenses() {
            const result = await auth.api.get('/expenses', {
                queryStringParameters: {
                    own: true
                }
            });
            setExpenses(result);
        }
        fetchExpenses();
    }, [auth.api]);
    return (
        <Page>
            <hgroup>
                <h1 className='title'>Welcome</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
            <div className='grid'>
                <button className='contrast'>
                    <FaReceipt /> Scan Receipt
                </button>
                <button className='contrast' onClick={() => navigate('/expense')}>
                    <FaPlus /> Other Expense
                </button>
            </div>
            <Tabs>
                <TabList>
                    <Tab>You Owe</Tab>
                    <Tab>My Expenses</Tab>
                </TabList>
                <TabPanel>
                    <h4>Name</h4>
                    <table>
                        {/* <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date</th>
                            </tr>
                        </thead> */}
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>
                                        <input type='checkbox' /> {expense.name}
                                    </td>
                                    <td>{expense.date}</td>
                                    <td>$100</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TabPanel>
                <TabPanel>
                    <p>My Expenses</p>
                </TabPanel>
            </Tabs>
        </Page>
    );
}

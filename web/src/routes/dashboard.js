import { useEffect, useRef, useState } from 'react';
import { FaReceipt, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import LoadingBlock from '../components/LoadingBlock';
import Page from '../components/Page';
import useAuth from '../hooks/useAuth';

import './dashboard.scss';

function col(pixels) {
    return {
        fontSize: '0.875em',
        minWidth: `${pixels}px`,
        maxWidth: `${pixels}px`,
    };
}

function formatCurrency(currency) {
    return `$${currency.toFixed(2)}`;
}

const buttonStyle = {
    padding: '2px 20px',
    marginBottom: 0,
    borderRadius: '100px',
    fontSize: 'small',
};

function Loading({ loaded, onMount, children }) {
    useEffect(() => {
        if (onMount) onMount();
    }, [onMount]);
    if (loaded !== undefined && !loaded) return <LoadingBlock style={{ height: '200px' }} />;
    if (typeof children === 'function') return children();
    return children;
}

function DueExpenseGroup({ name, expenses }) {
    const [selected, setSelected] = useState(new Set());
    const changeAll = useRef();

    const onChangeAll = e => {
        if (e.target.checked) setSelected(new Set(expenses.map(e => e.id)));
        else setSelected(new Set());
    };

    const onChange = id => {
        return e => {
            let state = new Set(selected);
            if (e.target.checked) state.add(id);
            else state.delete(id);
            setSelected(state);
        };
    };

    useEffect(() => {
        if (expenses.length === 0) return;
        if (selected.size === expenses.length) {
            changeAll.current.checked = true;
            changeAll.current.indeterminate = false;
        } else if (selected.size === 0) {
            changeAll.current.checked = false;
            changeAll.current.indeterminate = false;
        } else {
            changeAll.current.checked = false;
            changeAll.current.indeterminate = true;
        }
    }, [expenses, selected]);

    return (
        <>
            <nav>
                <h4 className='no-margin'>{name}</h4>
                <div style={{ display: 'flex', alignContent: 'center' }}>
                    <button style={buttonStyle}> {selected.size > 0 ? 'Pay Selected' : 'Pay All'}</button>
                </div>
            </nav>
            <table>
                <thead>
                    <tr>
                        <th style={col(30)}>
                            <input type='checkbox' onChange={onChangeAll} ref={changeAll} />
                        </th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>You Owe</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map(expense => (
                        <tr key={expense.id}>
                            <td style={col(30)}>
                                <input
                                    type='checkbox'
                                    onChange={onChange(expense.id)}
                                    checked={selected.has(expense.id)}
                                />
                            </td>
                            <td>{expense.name}</td>
                            <td>{expense.date}</td>
                            <td>{formatCurrency(expense.contribution)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function BasicExpenseGroup({ expenses }) {
    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {expenses.map(expense => (
                    <tr key={expense.id}>
                        <td>{expense.name}</td>
                        <td>{expense.date}</td>
                        <td>{formatCurrency(expense.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function Dashboard() {
    const auth = useAuth();
    const navigate = useNavigate();

    const [dueExpenses, setDueExpenses] = useState(null);
    const fetchDue = async () => {
        if (dueExpenses !== null) return;
        const result = await auth.api.get('/expenses', {
            queryStringParameters: { own: false, past: false },
        });
        // Map due expenses by who we owe money to
        result.expenses = result.expenses.reduce((grouped, expense) => {
            if (!grouped[expense.owner]) grouped[expense.owner] = [];
            grouped[expense.owner].push(expense);
            return grouped;
        }, {});
        setDueExpenses(result);
    };

    const [myExpenses, setMyExpenses] = useState(null);
    const fetchMine = async () => {
        if (myExpenses !== null) return;
        const result = await auth.api.get('/expenses', {
            queryStringParameters: { own: true, past: false },
        });
        setMyExpenses(result);
    };

    const [pastExpenses, setPastExpenses] = useState(null);
    const fetchPast = async () => {
        if (pastExpenses !== null) return;
        const [pastMine, pastDue] = await Promise.all([
            auth.api.get('/expenses', {
                queryStringParameters: { own: true, past: true },
            }),
            auth.api.get('/expenses', {
                queryStringParameters: { own: false, past: true },
            }),
        ]);

        setPastExpenses({
            expenses: [...pastMine.expenses, ...pastDue.expenses].sort((a, b) => b.date.localeCompare(a.date.localeCompare)),
            users: { ...pastMine.users, ...pastDue.users },
        });
    };

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
                    <Tab>Due</Tab>
                    <Tab>Active</Tab>
                    <Tab>Past</Tab>
                </TabList>
                <TabPanel>
                    <Loading loaded={dueExpenses} onMount={fetchDue}>
                        {() =>
                            Object.keys(dueExpenses.expenses).map(userID => (
                                <DueExpenseGroup key={userID} expenses={dueExpenses.expenses[userID]} />
                            ))
                        }
                    </Loading>
                </TabPanel>
                <TabPanel>
                    <Loading loaded={myExpenses} onMount={fetchMine}>
                        {() => <BasicExpenseGroup expenses={myExpenses.expenses} />}
                    </Loading>
                </TabPanel>
                <TabPanel>
                    <Loading>
                        <Loading loaded={pastExpenses} onMount={fetchPast}>
                            {() => <BasicExpenseGroup expenses={pastExpenses.expenses} />}
                        </Loading>
                    </Loading>
                </TabPanel>
            </Tabs>
        </Page>
    );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaReceipt, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Action } from 'react-tiny-fab';
import Fab from '../components/Fab';
import LoadingBlock from '../components/LoadingBlock';
import Page from '../components/Page';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../util/util';
import ConfirmPaymentModal from './expense/view/ConfirmPaymentModal';

import './dashboard.scss';

function col(pixels) {
    return {
        fontSize: '0.875em',
        minWidth: `${pixels}px`,
        maxWidth: `${pixels}px`,
    };
}

const buttonStyle = {
    padding: '2px 20px',
    marginBottom: 0,
    borderRadius: '10px',
    fontSize: 'small',
};

function Loadable({ fetch, children }) {
    // If content is:
    //  * undefined: content is loading
    //  * null: content failed to load
    const [content, setContent] = useState(undefined);

    const fetchContent = useCallback(() => {
        if (!fetch) return;
        Promise.resolve(fetch())
            .then(content => setContent(content))
            .catch(() => setContent(null));
    }, [fetch]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    if (content === undefined) return <LoadingBlock style={{ height: '200px' }} />;
    if (content === null)
        return (
            <div className='empty-container'>
                <small>
                    😞 Oops. That didn't load.{' '}
                    <span onClick={fetchContent} className='link secondary'>
                        Try again?
                    </span>
                </small>
            </div>
        );

    if (typeof children === 'function') return children(content);
    return children;
}

function ExpenseRow({ expense, children }) {
    const navigate = useNavigate();
    const openExpense = id => navigate(`/expense/${id}`);
    return (
        <tr className='click' onClick={() => openExpense(expense.id)}>
            {children}
        </tr>
    );
}

function DueExpenses({ groups }) {
    return Object.keys(groups).length === 0 ? (
        <div className='empty-container' align='center'>
            <small>It look's like you're all paid up &#x1F389;</small>
        </div>
    ) : (
        Object.keys(groups).map(group => (
            <DueExpenseGroup key={group} expenses={groups[group].expenses} name={groups[group].owner.firstName} />
        ))
    );
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

    const [confirmingPayment, setConfirmingPayment] = useState(false);

    const getSelectedExpenses = () => {
        if (selected.size === 0) return expenses;
        return expenses.filter(expense => selected.has(expense.id));
    };

    const selectedExpenses = getSelectedExpenses();
    const selectedContribution = selectedExpenses.reduce((total, expense) => total + expense.contribution, 0);

    return (
        <>
            <nav>
                <h5 className='no-margin'>{name}</h5>
                <div style={{ display: 'flex', alignContent: 'center' }}>
                    <button className='outline contrast' style={buttonStyle} onClick={() => setConfirmingPayment(true)}>
                        {' '}
                        {selected.size > 0 ? 'Pay Selected' : 'Pay All'}
                    </button>
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
                        <ExpenseRow key={expense.id} expense={expense}>
                            <td style={col(30)}>
                                <input
                                    type='checkbox'
                                    onChange={onChange(expense.id)}
                                    checked={selected.has(expense.id)}
                                    onClick={e => e.stopPropagation()}
                                />
                            </td>
                            <td>{expense.name}</td>
                            <td>{expense.date}</td>
                            <td>{formatCurrency(expense.contribution)}</td>
                        </ExpenseRow>
                    ))}
                </tbody>
            </table>
            <ConfirmPaymentModal
                ownerName={name}
                contribution={selectedContribution}
                expenseIds={selectedExpenses.map(e => e.id)}
                isOpen={confirmingPayment}
                onClose={() => setConfirmingPayment(false)}
            />
        </>
    );
}

function BasicExpenseGroup({ expenses }) {
    return (
        <>
            {expenses.length === 0 && (
                <div className='empty-container'>
                    <small>Nothing to see here &#128064;</small>
                </div>
            )}
            {expenses.length > 0 && (
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
                            <ExpenseRow key={expense.id} expense={expense}>
                                <td>{expense.name}</td>
                                <td>{expense.date}</td>
                                <td>{formatCurrency(expense.total)}</td>
                            </ExpenseRow>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

export default function Dashboard() {
    const auth = useAuth();
    const navigate = useNavigate();

    return (
        <Page>
            <hgroup>
                <h1 className='title'>Welcome</h1>
                <h2>Tap below to enter an expense</h2>
            </hgroup>
            <Tabs>
                <TabList>
                    <Tab>Due</Tab>
                    <Tab>Active</Tab>
                    <Tab>Past</Tab>
                </TabList>
                <TabPanel>
                    <Loadable
                        fetch={() =>
                            auth.api.get('/expenses', {
                                queryStringParameters: { own: false, past: false, group: true },
                            })
                        }>
                        {groups => <DueExpenses groups={groups} />}
                    </Loadable>
                </TabPanel>
                <TabPanel>
                    <Loadable
                        fetch={() =>
                            auth.api.get('/expenses', {
                                queryStringParameters: { own: true, past: false },
                            })
                        }>
                        {expenses => <BasicExpenseGroup expenses={expenses} />}
                    </Loadable>
                </TabPanel>
                <TabPanel>
                    <Loadable
                        fetch={() =>
                            auth.api.get('/expenses', {
                                queryStringParameters: { past: true },
                            })
                        }>
                        {expenses => <BasicExpenseGroup expenses={expenses} />}
                    </Loadable>
                </TabPanel>
            </Tabs>
            <Fab>
                <Action text={'Add Expense'} onClick={() => navigate('/expense')}>
                    <FaPlus />
                </Action>
                <Action text={'Scan Receipt'}>
                    <FaReceipt />
                </Action>
            </Fab>
        </Page>
    );
}

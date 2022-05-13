import Page from '../../../components/Page';
import './view.scss';

import SpendingDoughnut from './SpendingDoughnut';
import { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingBlock from '../../../components/LoadingBlock';
import Show from '../../../components/Show';
import toast from 'react-hot-toast';
import CloseHeader from '../../../components/CloseHeader';
import { formatCurrency } from '../../../util/util';

import { FaCalendar, FaCreditCard, FaThList, FaCommentsDollar } from 'react-icons/fa';
import moment from 'moment';

function resolveItemsTooltips(expense) {
    const items = expense.items;
    const subtotal = items.reduce((total, item) => total + item.quantity * item.price, 0);

    function evaluatePercentageAmountOverhead(current, pa) {
        if (!pa.value) return 0;
        switch (pa.type) {
            case 'percentage':
                return current * (1 + pa.value / 100) - current;
            case 'amount':
                return pa.value;
            default:
                throw Error('Invalid percentage amount type');
        }
    }

    function createPercentageAmountTooltip(overhead, pa) {
        if (!pa.value) return null;
        return `+${formatCurrency(overhead)}`;
    }

    let total = subtotal;

    const tax = evaluatePercentageAmountOverhead(total, expense.tax);
    const taxTooltip = createPercentageAmountTooltip(tax, expense.tax);
    total += tax;

    const tip = evaluatePercentageAmountOverhead(total, expense.tip);
    const tipTooltip = createPercentageAmountTooltip(tip, expense.tip);

    return {
        subtotalTooltip: formatCurrency(subtotal),
        taxTooltip,
        tipTooltip,
    };
}

function ItemsDisplay({ expense }) {
    const tooltips = resolveItemsTooltips(expense);
    return (
        <table className='items'>
            <thead>
                <tr>
                    <td>
                        <h6 className='icons no-margin'>
                            <FaThList /> Items
                        </h6>
                    </td>
                    <td></td>
                </tr>
            </thead>
            <tbody>
                {expense.items.map(item => (
                    <tr key={item.id}>
                        <td>
                            {item.quantity} {item.name}
                        </td>
                        <td>{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td>
                        <strong>Subtotal</strong>
                    </td>
                    <td>{tooltips.subtotalTooltip}</td>
                </tr>
                {tooltips.taxTooltip && <tr>
                    <td><strong>Tax</strong></td>
                    <td>{tooltips.taxTooltip}</td>
                </tr>}
                {tooltips.tipTooltip && <tr>
                    <td><strong>Tip</strong></td>
                    <td>{tooltips.tipTooltip}</td>
                </tr>}
            </tfoot>
        </table>
    );
}

export default function ViewExpense() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { expenseId } = useParams();
    const [expense, setExpense] = useState(null);

    useEffect(() => {
        async function getExpense() {
            try {
                const expense = await auth.api.get(`/expenses/${expenseId}`);
                setExpense(expense);
            } catch (e) {
                if (e.response.status === 404) {
                    navigate('/404', { replace: true });
                } else {
                    toast.error(`Couldn't get expense: ${e.message}`);
                    navigate(-1);
                }
            }
        }
        getExpense();
    }, [expenseId, auth.api, navigate]);

    const ownerName = () => {
        const owner = expense.users.find(u => u.user === expense.owner);
        if (owner.user === auth.user().getUsername()) return 'You';
        return `${owner.firstName} ${owner.lastName}`;
    };

    const formattedDate = () => moment(expense.date, 'YYYY-MM-DD').format("MMM Do, YYYY"); 

    return (
        <Page>
            <CloseHeader />
            {expense === null && <LoadingBlock style={{ height: '200px' }} />}
            <Show when={expense !== null}>
                {expense !== null && (
                    <>
                        <SpendingDoughnut expense={expense} />
                        <hgroup className='centered'>
                            <h1>{expense.name}</h1>
                            <h6>{ownerName()}</h6>
                        </hgroup>
                        <hr />
                        <br />
                        <hgroup>
                            <h6 className='icons'>
                                <FaCalendar /> Date
                            </h6>
                            <p>{formattedDate()}</p>
                        </hgroup>
                        <hgroup>
                            <h6 className='icons'>
                                <FaCreditCard /> Split
                            </h6>
                            <p style={{textTransform: 'capitalize'}}>{expense.split}</p>
                        </hgroup>
                        <hgroup>
                            <h6 className='icons'>
                                <FaCommentsDollar /> Contribution
                            </h6>
                            <p>You'll pay {formatCurrency(expense.contribution)}</p>
                        </hgroup>
                        
                        {expense.type === 'multiple' && <ItemsDisplay expense={expense} />}
                    </>
                )}
            </Show>
        </Page>
    );
}

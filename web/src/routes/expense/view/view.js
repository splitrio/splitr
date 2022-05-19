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

import {
    FaCalendar,
    FaCreditCard,
    FaThList,
    FaCommentsDollar,
    FaPen,
    FaTrash,
    FaCheck,
    FaTimes,
    FaLock,
} from 'react-icons/fa';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { Action } from 'react-tiny-fab';
import Fab from '../../../components/Fab';
import moment from 'moment';
import Modal from '../../../components/Modal';
import ConfirmPaymentModal from './ConfirmPaymentModal';

const DATE_FORMAT = 'MMM Do, YYYY';

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

function ItemsDetail({ expense }) {
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
                {tooltips.taxTooltip && (
                    <tr>
                        <td>
                            <strong>Tax</strong>
                        </td>
                        <td>{tooltips.taxTooltip}</td>
                    </tr>
                )}
                {tooltips.tipTooltip && (
                    <tr>
                        <td>
                            <strong>Tip</strong>
                        </td>
                        <td>{tooltips.tipTooltip}</td>
                    </tr>
                )}
            </tfoot>
        </table>
    );
}

const Relation = Object.freeze({
    Unconfirmed: 1, // Not owner, hasn't confirmed payment
    Confirmed: 2, // Not owner, has confirmed payment
    Owner: 3, // Owner, allow modifications (edit/delete)
    OwnerLocked: 4, // Owner, don't allow modifications
});

function getRelation(expense, userID) {
    if (expense.owner === userID) {
        if (expense.users.some(u => u.paid && u.user !== userID)) return Relation.OwnerLocked;
        return Relation.Owner;
    }

    if (expense.users.find(u => u.user === userID).paid) return Relation.Confirmed;
    return Relation.Unconfirmed;
}

const ViewState = Object.freeze({
    Viewing: 1,
    ConfirmDelete: 2,
    ConfirmPayment: 3,
    RescindPayment: 4,
});

function ConfirmDeleteModal({ expense, viewState, onClose }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const del = async () => {
        setDeleting(true);
        try {
            await auth.api.delete(`/expenses/${expense.id}`);
            navigate(-1, { replace: true });
        } catch (e) {
            console.log(e);
            toast.error(`Couldn't delete expense: ${e.message}`);
            setDeleting(false);
        }
    };
    return (
        <Modal shouldCloseOnOverlayClick={true} isOpen={viewState === ViewState.ConfirmDelete} onClose={onClose}>
            <CloseHeader onClick={onClose}>
                <hgroup>
                    <h3>Delete Expense?</h3>
                    <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
                </hgroup>
            </CloseHeader>
            <button className='danger outline' disabled={deleting} aria-busy={deleting} onClick={del}>
                Yes, I'm Sure
            </button>
        </Modal>
    );
}

function RescindPaymentModal({ expense, viewState, onClose }) {
    const auth = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const submit = async () => {
        setSubmitting(true);
        try {
            await auth.api.post(`/expenses/${expense.id}/rescind`);
            window.location.reload();
        } catch (e) {
            toast.error(`Couldn't rescind payment: ${e.message}`);
            setSubmitting(false);
        }
    };
    return (
        <Modal shouldCloseOnOverlayClick={true} isOpen={viewState === ViewState.RescindPayment} onClose={onClose}>
            <CloseHeader onClick={onClose}>
                <hgroup>
                    <h3>Rescind Payment?</h3>
                    <p>
                        Make sure to confirm again once you've paid{' '}
                        <strong>{expense.users.find(u => u.user === expense.owner).firstName}</strong> back 💰
                    </p>
                </hgroup>
            </CloseHeader>
            <button className='contrast outline' disabled={submitting} aria-busy={submitting} onClick={submit}>
                Yes, Rescind Payment
            </button>
        </Modal>
    );
}

function ExpenseFAB({ expense, relation }) {
    const [state, setState] = useState(ViewState.Viewing);
    const closeModal = () => setState(ViewState.Viewing);
    const navigate = useNavigate();

    // For expense confirmation modal
    const owner = expense.users.find(u => u.user === expense.owner);

    return (
        <>
            {relation !== Relation.OwnerLocked && (
                <Fab>
                    {relation === Relation.Owner && (
                        <Action
                            text='Edit Expense'
                            onClick={() => navigate('/expense', { state: { expense: expense } })}>
                            <FaPen />
                        </Action>
                    )}

                    {relation === Relation.Owner && (
                        <Action text='Delete Expense' onClick={() => setState(ViewState.ConfirmDelete)}>
                            <FaTrash />
                        </Action>
                    )}

                    {relation === Relation.Unconfirmed && (
                        <Action text='Confirm Payment' onClick={() => setState(ViewState.ConfirmPayment)}>
                            <FaCheck />
                        </Action>
                    )}

                    {relation === Relation.Confirmed && (
                        <Action text='Rescind Payment' onClick={() => setState(ViewState.RescindPayment)}>
                            <FaTimes />
                        </Action>
                    )}
                </Fab>
            )}

            <ConfirmPaymentModal
                isOpen={state === ViewState.ConfirmPayment}
                onClose={closeModal}
                ownerName={`${owner.firstName} ${owner.lastName}`}
                contribution={expense.contribution}
                expenseIds={[expense.id]}
            />
            <RescindPaymentModal expense={expense} onClose={closeModal} viewState={state} />
            <ConfirmDeleteModal expense={expense} onClose={closeModal} viewState={state} />
        </>
    );
}

function ExpenseDetail({ expense }) {
    const auth = useAuth();
    const ownerName = () => {
        const owner = expense.users.find(u => u.user === expense.owner);
        if (owner.user === auth.user().getUsername()) return 'You';
        return `${owner.firstName} ${owner.lastName}`;
    };

    const formattedDate = () => moment(expense.date, 'YYYY-MM-DD').format(DATE_FORMAT);
    const relation = getRelation(expense, auth.user().getUsername());

    const paidUserFirstNames = () => {
        const paidUsers = expense.users.filter(u => u.paid && u.user !== expense.owner);
        function firstNames() {
            if (paidUsers.length === 0) return '';
            if (paidUsers.length === 1) return paidUsers[0].firstName;
            if (paidUsers.length === 2) return `${paidUsers[0].firstName} and ${paidUsers[1].firstName}`;
            return paidUsers.reduce((names, user, index) => {
                if (index === paidUsers.length - 1) return names + ` and ${user.firstName}`;
                return names + `${user.firstName}, `;
            }, '');
        }
        return [firstNames(), paidUsers.length > 1];
    };

    const [paidUserNames, paidUserPlural] = paidUserFirstNames();

    const confirmedDate = () => {
        const dateString = expense.users.find(u => u.user === auth.user().getUsername()).paid_time;
        const date = moment(dateString);
        const lastWeek = moment().subtract(7, 'days');
        if (date.diff(lastWeek, 'days') > 0) return date.fromNow();
        return `on ${date.format(DATE_FORMAT)}`;
    };

    return (
        <>
            {/* <p data-tip='hello world'>Tooltip Text</p> */}
            <ExpenseFAB expense={expense} relation={relation} />
            <SpendingDoughnut expense={expense} />
            <hgroup className='centered'>
                <h1>{expense.name}</h1>
                <h6>{ownerName()}</h6>
            </hgroup>
            <hr />
            <br />
            {relation === Relation.OwnerLocked && (
                <hgroup>
                    <h6 className='icons'>
                        <FaLock /> Locked
                    </h6>
                    <p>
                        Since <strong>{paidUserNames}</strong> {paidUserPlural ? 'have' : 'has'} confirmed payment for
                        this expense, it can't be modified or deleted.
                    </p>
                </hgroup>
            )}
            {relation === Relation.Confirmed && (
                <hgroup>
                    <h6 className='icons'>
                        <BsFillPatchCheckFill /> Confirmed
                    </h6>
                    <p>You confirmed payment for this expense {confirmedDate()}.</p>
                </hgroup>
            )}
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
                <p style={{ textTransform: 'capitalize' }}>{expense.split}</p>
            </hgroup>
            <hgroup>
                <h6 className='icons'>
                    <FaCommentsDollar /> Contribution
                </h6>
                <p>
                    {expense.users.find(u => u.user === auth.user().getUsername()).paid ? 'You paid' : "You'll pay"}{' '}
                    {formatCurrency(expense.contribution)}
                </p>
            </hgroup>

            {expense.type === 'multiple' && <ItemsDetail expense={expense} />}
        </>
    );
}

export default function ViewExpense() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { expenseId } = useParams();
    const [expense, setExpense] = useState(null);

    useEffect(() => {
        if (expense !== null) return;
        async function getExpense() {
            try {
                const expense = await auth.api.get(`/expenses/${expenseId}`);
                setExpense(expense);
            } catch (e) {
                if (e.response.status === 404) {
                    navigate('/404', { replace: true });
                } else {
                    toast.error(`Couldn't get expense: ${e.message}`);
                    navigate(-1, { replace: true });
                }
            }
        }
        getExpense();
    }, [expense, expenseId, auth.api, navigate]);

    return (
        <Page>
            <CloseHeader />
            {expense === null && <LoadingBlock style={{ height: '200px' }} />}
            <Show when={expense !== null}>{expense !== null && <ExpenseDetail expense={expense} />}</Show>
        </Page>
    );
}

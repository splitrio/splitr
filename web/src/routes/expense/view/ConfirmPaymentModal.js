import useAuth from '../../../hooks/useAuth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../util/util';
import CloseHeader from '../../../components/CloseHeader';
import Modal from '../../../components/Modal';

export default function ConfirmPaymentModal({ ownerName, contribution, expenseIds, isOpen, onClose }) {
    const containerStyles = {
        height: '200px',
        display: 'flex',
        alignItems: 'center',
    };
    const currencyStyles = {
        fontSize: '3em',
        margin: '0 auto',
    };

    const auth = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const submit = async () => {
        setSubmitting(true);
        try {
            await auth.api.post(`/expenses/confirm`, { body: expenseIds });
            window.location.reload();
        } catch (e) {
            toast.error(`Couldn't confirm payment: ${e.message}`);
            console.log(JSON.stringify(e, null, 2));
            setSubmitting(false);
        }
    };

    return (
        <Modal shouldCloseOnOverlayClick={true} isOpen={isOpen} onClose={onClose}>
            <CloseHeader onClick={onClose}>
                <hgroup className='no-space'>
                    <h3>Confirm Payment?</h3>
                    <p>
                        This confirms that you've paid <strong>{ownerName}</strong> this amount.
                    </p>
                </hgroup>
            </CloseHeader>
            <div style={containerStyles}>
                <h1 style={currencyStyles}>{formatCurrency(contribution)}</h1>
            </div>
            <button className='contrast outline' disabled={submitting} aria-busy={submitting} onClick={submit}>
                Yes, I Paid This Amount
            </button>
        </Modal>
    );
}

import useAuth from '../../../hooks/useAuth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../util/util';
import CloseHeader from '../../../components/CloseHeader';
import Modal from '../../../components/Modal';
import LoadingBlock from '../../../components/LoadingBlock';
import { venmoUserExists } from '../../../components/ConnectVenmo';
import { IoLogoVenmo } from 'react-icons/io5';

export default function ConfirmPaymentModal({ ownerName, ownerId, contribution, expenses, isOpen, onClose }) {
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
            await auth.api.post(`/expenses/confirm`, { body: expenses.map(e => e.id) });
            window.location.reload();
        } catch (e) {
            toast.error(`Couldn't confirm payment: ${e.message}`);
            console.log(JSON.stringify(e, null, 2));
            setSubmitting(false);
        }
    };

    const [loading, setLoading] = useState(true);
    const [venmo, setVenmo] = useState(null);

    function getVenmoDeeplink() {
        function getNote() {
            if (expenses.length === 1) return expenses[0].name;
            if (expenses.length === 2) return `${expenses[0].name} & ${expenses[1].name}`;

            let note = '';
            for (let i = 0; i < expenses.length - 1; i++) note += `${expenses[i].name}, `;
            return `${note}& ${expenses[expenses.length - 1].name}`;
        }

        return `https://venmo.com/${encodeURIComponent(venmo)}?txn=pay&note=${encodeURIComponent(getNote())}&amount=${encodeURIComponent(formatCurrency(contribution))}`;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onAfterOpen={async () => {
                setLoading(true);

                // Get user's venmo, if it exists
                setVenmo(null);
                try {
                    const user = await auth.api.get(`/users/${ownerId}`);
                    if (await venmoUserExists(user.venmo)) setVenmo(user.venmo);
                } catch (e) {
                    console.error(e);
                }

                setLoading(false);
            }}>
            {loading ? (
                <LoadingBlock height='200px' />
            ) : (
                <>
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
                    <div className='grid' style={{ marginTop: '30px' }}>
                        {venmo && (
                            <button
                                className='contrast outline'
                                onClick={() => window.open(getVenmoDeeplink(), '_blank')}>
                                <IoLogoVenmo /> Open in Venmo
                            </button>
                        )}
                        <button
                            className='contrast outline'
                            disabled={submitting}
                            aria-busy={submitting}
                            onClick={submit}>
                            Yes, I Paid This Amount
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}

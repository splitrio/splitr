import { useState } from 'react';
import LoadingBlock from './LoadingBlock';
import Modal from './Modal';
import { Formik, Form } from 'formik';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { object, string } from 'yup';
import useAuth from '../hooks/useAuth';
import LabelInput from './form/LabelInput';
import toast from 'react-hot-toast';
import Show from './Show';
import CloseHeader from './CloseHeader';

const VenmoSchema = object({
    username: string().required('Required!'),
});

async function venmoUserExists(username) {
    if (!username) return false;
    try {
        const response = await fetch(`/api/venmo/${username}`);
        return response.ok;
    } catch (e) {
        console.error(e);
    }
    return null;
}

const tooltipStyle = {
    color: 'var(--form-element-valid-active-border-color)',
};

export default function ConnectVenmo({ state, onClose }) {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [initUsername, setInitUsername] = useState('');

    const auth = useAuth();

    async function currentVenmo() {
        const attributes = await auth.attributes();
        const key = 'custom:venmo';
        if (!(key in attributes)) return null;
        return attributes[key];
    }

    async function disconnectVenmo() {
        setDisconnecting(true);
        try {
            await auth.clearAttributes(['custom:venmo']);
            setConnected(false);
        } catch (e) {
            toast.error("Couldn't disconnect Venmo. Please try again later.");
            console.error(e);
        }
        setDisconnecting(false);
    }

    return (
        <Modal
            isOpen={state === ConnectVenmo.States.Open}
            onClose={onClose}
            onAfterOpen={async () => {
                setLoading(true);
                setDisconnecting(false);

                const venmo = await currentVenmo();
                if (venmo) setInitUsername(`@${venmo}`);
                else setInitUsername('');

                setConnected(await venmoUserExists(venmo));
                setLoading(false);
            }}>
            {loading ? (
                <LoadingBlock height='200px' />
            ) : (
                <Formik
                    initialValues={{ username: initUsername }}
                    validationSchema={VenmoSchema}
                    onSubmit={async ({ username }) => {
                        if (username.startsWith('@')) username = username.substring(1);
                        const valid = await venmoUserExists(username);
                        if (valid === null) toast.error("Couldn't connect Venmo. Try again later.");
                        else if (!valid) toast.error("Couldn't find a Venmo user by that name.");
                        else {
                            // user entered a valid venmo username
                            try {
                                await auth.updateAttributes({
                                    'custom:venmo': username,
                                });
                                setConnected(true);
                            } catch (e) {
                                toast.error("Couldn't connect Venmo. Try again later.");
                                console.error(e);
                            }
                        }
                    }}>
                    {({ isSubmitting }) => (
                        <Form>
                            <CloseHeader onClick={onClose}>
                                <hgroup>
                                    <h3>Connect Venmo</h3>
                                    <h3>Enter your Venmo so others can send you money through the app</h3>
                                </hgroup>
                            </CloseHeader>
                            <LabelInput
                                name='username'
                                label='Venmo Username'
                                placeholder='@my-venmo'
                                readOnly={connected}
                                tooltip={
                                    connected &&
                                    (disconnecting ? (
                                        <small style={tooltipStyle} aria-busy>
                                            Disconnecting...
                                        </small>
                                    ) : (
                                        <small style={tooltipStyle}>
                                            <FiCheckCircle /> You're connected.{' '}
                                            <span className='click hoverline' onClick={disconnectVenmo}>
                                                Disconnect?
                                            </span>
                                        </small>
                                    ))
                                }
                            />
                            <Show when={!connected}>
                                <button
                                    type='submit'
                                    className='contrast'
                                    disabled={isSubmitting}
                                    aria-busy={isSubmitting}>
                                    {!isSubmitting && <FiCheck className='icon' />} Connect
                                </button>
                            </Show>
                        </Form>
                    )}
                </Formik>
            )}
        </Modal>
    );
}

ConnectVenmo.States = Object.freeze({
    Closed: 0,
    Open: 1,
});

export { venmoUserExists };

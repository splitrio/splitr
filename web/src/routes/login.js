import { Formik, Form } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { bool, object, ref, string } from 'yup';
import LabelInput from '../components/form/LabelInput';
import Switch from '../components/form/Switch';
import Page from '../components/Page';
import useAuth, { UpdatePasswordError } from '../hooks/useAuth';
import Modal from '../components/Modal';

const LoginSchema = object({
    email: string().email('Enter a valid email').required('Required!'),
    password: string().required('Required!'),
    rememberMe: bool()
});

const UpdatePasswordSchema = oldPassword => object({
    password: string().min(8, 'Must be at least 8 characters long!').required('Required').notOneOf([oldPassword], "You must choose a new password!"),
    confirmPassword: string().oneOf([ref('password')], "Passwords don't match!").required('Required!')
});

const ConfirmPasswordModal = (isOpen, oldPassword, onSubmit) => (
    <Modal isOpen={isOpen}>
        <hgroup>
            <h2>Update your password</h2>
            <h2>It looks like your using a temporary password.</h2>
        </hgroup>
        <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={UpdatePasswordSchema(oldPassword)}
            onSubmit={onSubmit}
        >
            {({ errors, isSubmitting }) => (
                <Form noValidate>
                    <LabelInput type='password' label='Password' name='password' placeholder='New Password' />
                    <LabelInput type='password' label='Confirm Password' name='confirmPassword' placeholder='Confirm Password' />
                    <button type="submit" className="contrast" disabled={Object.keys(errors).length > 0 || isSubmitting} aria-busy={isSubmitting}>Update Password</button>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { state } = useLocation();
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const from = state?.from || '/';

    // If we are already authenticated, don't show the log in screen under any circumstances,
    // instead navigating to the home screen
    if (auth.authenticated)
        return <Navigate to='/' replace />

    async function login(values, { setSubmitting }) {
        // Small pause for effect
        await new Promise(r => setTimeout(r, 200));
        try {
            await auth.signIn(values.email, values.password, values.rememberMe);
            navigate(from, { replace: true });
        } catch (error) {
            if (error instanceof UpdatePasswordError) setUpdatingPassword(true);
            else toast.error(`Failed to log in: ${error.message}`)
        }
        setSubmitting(false);
    }

    async function updatePassword(values, { setSubmitting }) {
        // Small pause for effect
        await new Promise(r => setTimeout(r, 200));
        try {
            await auth.updatePassword(values.password);
            setUpdatingPassword(false);
            navigate(from, { replace: true });
        } catch (error) {
            toast.error(`Failed to update password: ${error.message}`);
        }
        setSubmitting(false);
    }

    return (
        <Page>
            <hgroup>
                <h1 className="title">splitr</h1>
                <h2>A web-app for sharing expenses among friends.</h2>
            </hgroup>
            <Formik
                initialValues={{ email: '', password: '', rememberMe: true }}
                validationSchema={LoginSchema}
                onSubmit={login}
            >
                {({ values, isSubmitting }) => (
                    <>
                        {ConfirmPasswordModal(updatingPassword, values.password, updatePassword)}
                        <Form noValidate>
                            <LabelInput type='text' label='Email' name='email' placeholder='Email' autoComplete='email' />
                            <LabelInput type='password' label='Password' name='password' placeholder='Password' autoComplete='password' />
                            <Switch name='rememberMe' label='Remember Me' />
                            <button type="submit" className="contrast" disabled={isSubmitting} aria-busy={isSubmitting}>Login</button>
                            <div style={{textAlign: 'center'}}>
                                <small>Don't have an account? Sign up</small>
                            </div>
                        </Form>
                    </>
                )}
            </Formik>
        </Page>
    );
}
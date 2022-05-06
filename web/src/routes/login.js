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
import { NullableNumber } from '../util/schema';
import CloseHeader from '../components/CloseHeader';

const LoginState = Object.freeze({
    Login: 0,
    UpdatePassword: 1,
    SignUp: 2
});

/* ========================
 * Schema Definitions
 * ========================
 */

const PasswordSchemas = {
    password: string().min(8, 'Must be at least 8 characters long!').required('Required'),
    confirmPassword: string().oneOf([ref('password')], "Passwords don't match!").required('Required!')
};

const LoginSchema = object({
    email: string().email('Enter a valid email').required('Required!'),
    password: string().required('Required!'),
    rememberMe: bool()
});

const UpdatePasswordSchema = oldPassword => object({
    password: PasswordSchemas.password.notOneOf([oldPassword], "You must choose a new password!"),
    confirmPassword: PasswordSchemas.confirmPassword
});

const SignUpSchema = object({
    firstName: string().required('Required!'),
    lastName: string().required('Required!'),
    email: string().email('Enter a valid email!').required('Required!'),
    password: PasswordSchemas.password,
    confirmPassword: PasswordSchemas.confirmPassword,
    hourlyWage: NullableNumber().positive('Must be positive!').required('Required!'),
    accessKey: string().required('Enter an access key!')
});

const UpdatePasswordModal = ({ isOpen, oldPassword, onSubmit }) => (
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

const SignUpModal = ({ isOpen, onClose, onSubmit }) => (
    <Modal isOpen={isOpen} shouldCloseOnOverlayClick={true} onClose={onClose}>
        <CloseHeader onClick={() => onClose()}>
            <h3>Sign Up</h3>
        </CloseHeader>
        <Formik
            validationSchema={SignUpSchema}
            onSubmit={onSubmit}
            initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                hourlyWage: '',
                accessKey: ''
            }}
        >
            {({ isSubmitting }) => (
                <Form>
                    <div className='grid'>
                        <LabelInput type='text' label='First Name' name='firstName' placeholder='John' />
                        <LabelInput type='text' label='Last Name' name='lastName' placeholder='Doe' />
                    </div>
                    <LabelInput type='text' label='Email' name='email' placeholder='someone@example.com' tooltip="You'll log in with your email" showTooltipOnFocus />
                    <LabelInput label='Hourly Wage' name='hourlyWage' placeholder='Hourly Wage'
                        tooltip='This is used to determine how expenses will be split.' showTooltipOnFocus
                        type='text' inputMode='decimal' pattern='[0-9.]*' />
                    <LabelInput type='password' label='Password' name='password' placeholder='Password' />
                    <LabelInput type='password' label='Confirm Password' name='confirmPassword' placeholder='Confirm Password' />
                    <LabelInput type='text' label='Access Code' name='accessKey' placeholder='Your Access Code' />
                    <button type="submit" className="contrast" disabled={isSubmitting} aria-busy={isSubmitting}>Sign Up</button>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default function Login() {
    const auth = useAuth();
    const [state, setState] = useState(LoginState.Login);

    const { state: navigationState } = useLocation();
    const from = navigationState?.from || '/';
    const navigate = useNavigate();

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
            if (error instanceof UpdatePasswordError) setState(LoginState.UpdatePassword);
            else toast.error(`Failed to log in: ${error.message}`)
        }
        setSubmitting(false);
    }

    async function updatePassword(values, { setSubmitting }) {
        // Small pause for effect
        await new Promise(r => setTimeout(r, 200));
        try {
            await auth.updatePassword(values.password);
            setState(LoginState.Login);
            navigate(from, { replace: true });
        } catch (error) {
            toast.error(`Failed to update password: ${error.message}`);
        }
        setSubmitting(false);
    }

    async function signUp(values, { setSubmitting }) {
        try {
            await auth.signUp(values);

            // Sign up was successful
            // Try to sign the user in automatically
            try {
                await auth.signIn(values.email, values.password);
                toast.success("Sign up successful! Welcome to splitr.");
                setState(LoginState.Login);
                navigate(from, { replace: true });
            } catch (error) {
                console.log("Sign in failed after successful sign up", error);
                toast.success('Sign up successful! Please sign in.');
                setState(LoginState.Login);
            }
        } catch (error) {
            console.log(error);
            toast.error(`Failed to sign up: ${error.message}`);
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
                        <UpdatePasswordModal isOpen={state === LoginState.UpdatePassword} oldPassword={values.password} onSubmit={updatePassword} />
                        <SignUpModal isOpen={state === LoginState.SignUp} onSubmit={signUp} onClose={() => setState(LoginState.Login)} />
                        <Form noValidate>
                            <LabelInput type='text' label='Email' name='email' placeholder='Email' autoComplete='email' />
                            <LabelInput type='password' label='Password' name='password' placeholder='Password' autoComplete='password' />
                            <Switch name='rememberMe' label='Remember Me' />
                            <button type="submit" className="contrast" disabled={isSubmitting} aria-busy={isSubmitting}>Login</button>
                            <div style={{ textAlign: 'center' }}>
                                <small>Don't have an account? <span onClick={() => setState(LoginState.SignUp)} className='link secondary'>Sign up</span></small>
                            </div>
                        </Form>
                    </>
                )}
            </Formik>
        </Page>
    );
}
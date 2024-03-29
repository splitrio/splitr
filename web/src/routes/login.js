import { Formik, Form } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { bool, object, ref, string } from 'yup';
import LabelInput from '../components/form/LabelInput';
import Switch from '../components/form/Switch';
import Page from '../components/Page';
import useAuth from '../hooks/useAuth';
import Modal from '../components/Modal';
import { NullableNumber } from '../util/schema';
import CloseHeader from '../components/CloseHeader';
import { AnimatePresence, motion } from 'framer-motion';

const LoginState = Object.freeze({
    Login: 0,
    SignUp: 1,
    ForgotPassword: 2,
});

/* ========================
 * Schema Definitions
 * ========================
 */

const EmailSchema = string().email('Enter a valid email!').required('Required!');
const NewPasswordSchema = string().min(8, 'Must be at least 8 characters long!').required('Required');

const LoginSchema = object({
    email: EmailSchema,
    password: string().required('Required!'),
    rememberMe: bool(),
});

const SignUpSchema = object({
    firstName: string().required('Required!'),
    lastName: string().required('Required!'),
    email: EmailSchema,
    password: NewPasswordSchema,
    confirmPassword: string()
        .oneOf([ref('password')], "Passwords don't match!")
        .required('Required!'),
    hourlyWage: NullableNumber().positive('Must be positive!').required('Required!'),
    accessKey: string().required('Enter an access key!'),
});

const ForgotPasswordSchemas = {
    Email: object({
        email: EmailSchema,
    }),
    Confirmation: object({
        code: string().required('Required!').length(6, 'Codes are six numbers long.'),
        password: NewPasswordSchema,
        confirmPassword: string()
            .oneOf([ref('password')], "Passwords don't match!")
            .required('Required!'),
    }),
};

/* ========================
 * Login-Related Modals
 * ========================
 */

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
                accessKey: '',
            }}>
            {({ isSubmitting }) => (
                <Form>
                    <div className='grid'>
                        <LabelInput type='text' label='First Name' name='firstName' placeholder='John' />
                        <LabelInput type='text' label='Last Name' name='lastName' placeholder='Doe' />
                    </div>
                    <LabelInput
                        type='text'
                        label='Email'
                        name='email'
                        placeholder='someone@example.com'
                        tooltip="You'll log in with your email"
                        showTooltipOnFocus
                    />
                    <LabelInput
                        label='Hourly Wage'
                        name='hourlyWage'
                        placeholder='Hourly Wage'
                        tooltip='This is used to determine how expenses will be split.'
                        showTooltipOnFocus
                        type='text'
                        inputMode='decimal'
                        pattern='[0-9.]*'
                    />
                    <LabelInput type='password' label='Password' name='password' placeholder='Password' />
                    <LabelInput
                        type='password'
                        label='Confirm Password'
                        name='confirmPassword'
                        placeholder='Confirm Password'
                    />
                    <LabelInput type='text' label='Access Code' name='accessKey' placeholder='Your Access Code' />
                    <button type='submit' className='contrast' disabled={isSubmitting} aria-busy={isSubmitting}>
                        Sign Up
                    </button>
                </Form>
            )}
        </Formik>
    </Modal>
);

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const auth = useAuth();
    const [email, setEmail] = useState();
    const [state, setState] = useState(ForgotPasswordModal.States.Email);

    const toastError = e => toast.error(`Couldn't reset password: ${e.message}`);

    const Header = ({ children }) => (
        <CloseHeader onClick={onClose}>
            <hgroup>
                <h3>Forgot Password</h3>
                <p>{children}</p>
            </hgroup>
        </CloseHeader>
    );

    const Email = () => (
        <Formik
            validationSchema={ForgotPasswordSchemas.Email}
            initialValues={{ email: '' }}
            onSubmit={async (values) => {
                try {
                    await auth.forgotPassword(values.email);
                    setEmail(values.email);
                    setState(ForgotPasswordModal.States.Confirmation);
                } catch (e) {
                    toastError(e);
                }
            }}>
            {({ isSubmitting }) => (
                <Form>
                    <Header>Please enter the email you used to sign in to your account.</Header>
                    <LabelInput type='text' label='Email' name='email' placeholder='someone@example.com' />
                    <button type='submit' className='contrast' disabled={isSubmitting} aria-busy={isSubmitting}>
                        Reset Password
                    </button>
                </Form>
            )}
        </Formik>
    );

    const Confirmation = () => (
        <Formik
            validationSchema={ForgotPasswordSchemas.Confirmation}
            initialValues={{ code: '', password: '', confirmPassword: '' }}
            onSubmit={async (values) => {
                try {
                    await auth.forgotPasswordSubmit(email, values.code, values.password);
                    toast.success('Successfully reset password. Please log in.');
                    onClose();
                } catch (e) {
                    toastError(e);
                }
            }}>
            {({ isSubmitting }) => (
                <Form>
                    <Header>We sent a confirmation code to your email to verify it's you.</Header>
                    <LabelInput type='text' label='Your Code' name='code' />
                    <LabelInput type='password' label='Password' name='password' placeholder='Password' />
                    <LabelInput
                        type='password'
                        label='Confirm Password'
                        name='confirmPassword'
                        placeholder='Confirm Password'
                    />
                    <button type='submit' className='contrast' disabled={isSubmitting} aria-busy={isSubmitting}>
                        Change Password
                    </button>
                </Form>
            )}
        </Formik>
    );

    const stateContainerStyles = {
        minHeight: '300px',
        position: 'relative',
    };

    return (
        <Modal
            isOpen={isOpen}
            shouldCloseOnOverlayClick={true}
            onClose={onClose}
            onAfterOpen={() => setState(ForgotPasswordModal.States.Email)}>
            <AnimatePresence initial={false}>
                <div style={stateContainerStyles}>
                    <motion.div key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {state === ForgotPasswordModal.States.Email && <Email />}
                        {state === ForgotPasswordModal.States.Confirmation && <Confirmation />}
                    </motion.div>
                </div>
            </AnimatePresence>
        </Modal>
    );
};

ForgotPasswordModal.States = Object.freeze({
    Email: 0,
    Confirmation: 1
});

export default function Login() {
    const auth = useAuth();
    const [state, setState] = useState(LoginState.Login);

    const { state: navigationState } = useLocation();
    const from = navigationState?.from || '/';
    const navigate = useNavigate();

    // If we are already authenticated, don't show the log in screen under any circumstances,
    // instead navigating to the home screen
    if (auth.authenticated()) return <Navigate to='/' replace />;

    async function login(values, { setSubmitting }) {
        // Small pause for effect
        await new Promise(r => setTimeout(r, 200));
        try {
            await auth.signIn(values.email, values.password, values.rememberMe);
            navigate(from, { replace: true });
        } catch (error) {
            toast.error(`Failed to log in: ${error.message}`);
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
                toast.success('Sign up successful! Welcome to splitr.');
                setState(LoginState.Login);
                navigate(from, { replace: true });
            } catch (error) {
                console.log('Sign in failed after successful sign up', error);
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
        <Page
            nav={
                <strong className='click' onClick={() => setState(LoginState.SignUp)}>
                    Sign up
                </strong>
            }>
            <hgroup>
                <h1 className='title'>splitr</h1>
                <h2>A web-app for sharing expenses among friends.</h2>
            </hgroup>
            <Formik
                initialValues={{ email: '', password: '', rememberMe: true }}
                validationSchema={LoginSchema}
                onSubmit={login}>
                {({ values, isSubmitting }) => (
                    <>
                        <SignUpModal
                            isOpen={state === LoginState.SignUp}
                            onSubmit={signUp}
                            onClose={() => setState(LoginState.Login)}
                        />
                        <ForgotPasswordModal
                            isOpen={state === LoginState.ForgotPassword}
                            onClose={() => setState(LoginSchema.Login)}
                        />
                        <Form noValidate>
                            <LabelInput
                                type='text'
                                label='Email'
                                name='email'
                                placeholder='Email'
                                autoComplete='email'
                            />
                            <LabelInput
                                type='password'
                                label='Password'
                                name='password'
                                placeholder='Password'
                                autoComplete='password'
                            />
                            <Switch name='rememberMe' label='Remember Me' />
                            <button type='submit' className='contrast' disabled={isSubmitting} aria-busy={isSubmitting}>
                                Login
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <small>
                                    <span
                                        onClick={() => setState(LoginState.ForgotPassword)}
                                        className='link secondary'>
                                        Forgot Password?
                                    </span>
                                </small>
                            </div>
                        </Form>
                    </>
                )}
            </Formik>
        </Page>
    );
}

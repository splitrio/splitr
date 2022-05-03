import { Auth } from 'aws-amplify';
import { Formik, Form } from 'formik';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { bool, object, string } from 'yup';
import LabelInput from '../components/form/LabelInput';
import Switch from '../components/form/Switch';
import Page from '../components/Page';

const LoginSchema = object({
    email: string().email('Enter a valid email').required('Required!'),
    password: string().required('Required!'),
    rememberMe: bool()
});

export default function Login() {
    const navigate = useNavigate();

    const submit = async (values, { setSubmitting }) => {
        // Small pause for effect
        await new Promise(r => setTimeout(r, 200));
        try {
            await Auth.signIn(values.email, values.password);
            navigate('/dashboard');
        } catch (error) {
            toast.error(`Failed to log in: ${error.message}`)
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
                initialValues={{ email: '', password: '', rememberMe: false }}
                validationSchema={LoginSchema}
                onSubmit={submit}
            >
                {({ isSubmitting }) => (
                    <Form noValidate>
                        <LabelInput type='text' label='Email' name='email' placeholder='Email' autoComplete='email' />
                        <LabelInput type='password' label='Password' name='password' placeholder='Password' autoComplete='password' />
                        <Switch name='rememberMe' label='Remember Me' />
                        <button type="submit" className="contrast" disabled={isSubmitting} aria-busy={isSubmitting}>Login</button>
                    </Form>
                )}
            </Formik>
        </Page>
    );
}
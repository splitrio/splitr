import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';

import './expense.scss';

export default function Expense() {
    const navigate = useNavigate();
    return (
        <div>
            <span id="back"><FiX onClick={() => navigate(-1)} /></span>
            <h2>Add Expense</h2>
            <Formik
                initialValues={{ email: '', password: '' }}
                validate={values => {
                    const errors = {};
                    if (!values.email) {
                        errors.email = 'Required';
                    } else if (
                        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
                    ) {
                        errors.email = 'Invalid email address';
                    }
                    return errors;
                }}
                onSubmit={(values, { setSubmitting }) => {
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
                }}
            >
                {({ touched, errors, isSubmitting }) => (
                    <Form>
                        <label htmlFor="email">Email</label>
                        <Field type="email" name="email" aria-invalid={touched.email && !!errors.email}/>
                        <ErrorMessage name="email" component="small" />
                        <label htmlFor="password">Password</label>
                        <Field type="password" name="password" />
                        <ErrorMessage name="password" component="small" />
                        <button className="contrast" type="submit" disabled={isSubmitting}>
                            Add
                        </button>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
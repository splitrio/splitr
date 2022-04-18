import { FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import Page from '../components/Page';

export default function Expense() {
    return (
        <Page>
            <nav>
                <h2>Add Expense</h2>
                <Link to={-1} className="contrast" id="back"><FiX style={{ fontSize: 32 + 'px' }}/></Link>
            </nav>
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
                        <Field type="email" name="email" aria-invalid={touched.email && !!errors.email} />
                        <ErrorMessage name="email" component="small" />
                        <label htmlFor="password">Password</label>
                        <Field type="password" name="password" />
                        <ErrorMessage name="password" component="small" />
                        <table>
                            <colgroup>
                                <col span="1" style={{width: 70 + '%'}} />
                                <col span="1" style={{width: 15 + '%'}} />
                                <col span="1" style={{width: 15 + '%'}} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Price</th>
                                    <th scope="col">Belongs To</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Iced Cappucino</th>
                                    <td>$5.45</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th scope="row">BLT Sandwich</th>
                                    <td>$10.24</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <th scope="row">Chicken Parmesan</th>
                                    <td>$15.60</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                        <button className="contrast" type="submit" disabled={isSubmitting}>
                            Add
                        </button>
                    </Form>
                )}
            </Formik>
            {/* <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/> */}
        </Page>
    );
}
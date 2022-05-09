import { FiPlusCircle, FiTrash } from 'react-icons/fi';
import { Formik, Form, FieldArray } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Page from '../../components/Page';
import Show from '../../components/Show';
import ItemModal from './ItemModal';
import CloseHeader from '../../components/CloseHeader';
import { DefaultExpense, ExpenseSchema } from './schema';
import LabelInput from '../../components/form/LabelInput';
import Switch from '../../components/form/Switch';
import PercentageAmountSelector from '../../components/form/PercentageAmountSelector';

import './expense.scss';
import { API } from 'aws-amplify';
import useAuth from '../../hooks/useAuth';

function isNumeric(value) {
    if (typeof value === 'number') return !isNaN(value);
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function computeSubtotal(values) {
    return values.items.reduce((total, {price, quantity}) => total + price * quantity, 0) || null;
}

function displaySubtotal(values) {
    const subtotal = computeSubtotal(values);
    if (!subtotal) return '-';
    return `$${subtotal.toFixed(2)}`;
}

function computeTotal(values) {
    const parsePercentAmount = (current, percentAmount) => {
        if (!current) return null;
        if (percentAmount.value === '') return current;
        if (!isNumeric(percentAmount.value)) return null;
        const value = parseFloat(percentAmount.value);
        switch (percentAmount.type) {
            case 'percentage': return current * (1 + value / 100);
            case 'amount': return current + value;
            default: return current;
        }
    }

    switch (values.type) {
        case 'single': return !isNumeric(values.amount) ? null : parseFloat(values.amount);
        case 'multiple':
            let total = computeSubtotal(values);
            total = parsePercentAmount(total, values.tax);
            total = parsePercentAmount(total, values.tip);
            return total;
        default: return null;
    }
}

function submitText(values) {
    const total = computeTotal(values);
    if (!total) return 'Add Expense';
    return `Add Expense${total ? ' • $' + total.toFixed(2) : ''}`;
}

export default function Expense() {
    function getSplitTooltip(split) {
        switch (split) {
            case 'proportionally': return 'Expense will be split up by salary';
            case 'equally': return 'Expense will be split equally';
            case 'individually': return 'You\'ll pay for this expense yourself';
            default: return '';
        }
    }

    function updateItem(values, pushValue, newItem) {
        for (let i = 0; i < values.length; i++)
            if (values[i].id === newItem.id) {
                values[i] = newItem;
                return;
            }
        pushValue(newItem);
    }

    function onSubmitClicked(errors, values) {
        // Toast no items when no other errors are pending
        if (Object.keys(errors).length === 1 && errors.items && values.items.length === 0)
            toast.error('Add at least one item!');
    }

    const auth = useAuth();
    const [editing, setEditing] = useState(-1);

    return (
        <Page>
            <CloseHeader>
                <hgroup>
                    <h2>Add Expense</h2>
                    <h2>Let's get some basic information about the expense</h2>
                </hgroup>
            </CloseHeader>
            <Formik
                initialValues={DefaultExpense()}
                validationSchema={ExpenseSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        const user = auth.user();
                        const token = user.signInUserSession.idToken.jwtToken;
                        const result = await API.post('splitr', '/expenses', {
                            headers: {
                                auth: token
                            },
                            body: ExpenseSchema.cast(values)
                        });
                        alert(JSON.stringify(result, null, 2));
                        setSubmitting(false);
                    } catch (e) {
                        console.log(e);
                    }
                }}
            >
                {({ values, errors, isSubmitting }) => (
                    <Form noValidate>
                        <LabelInput type='text' name='name' label='Name' placeholder='e.g. Groceries, Rent' />
                        <LabelInput type='date' name='date' label='Date' />
                        <LabelInput as='select' name='split' label='Split' tooltip={<small>{getSplitTooltip(values.split)}</small>}>
                            <option value="proportionally">Proportionally</option>
                            <option value="equally">Equally</option>
                            <option value="individually">Individually</option>
                        </LabelInput>
                        <LabelInput as='select' name='type' label='Expense Type'>
                            <option value="single">Lump Sum</option>
                            <option value="multiple">Multiple Items</option>
                        </LabelInput>

                        <Show when={values.type === 'single'}>
                            <LabelInput type='text' name='amount' label='Amount' inputMode="decimal" pattern="[0-9.]*" />
                        </Show>

                        <Show when={values.type === 'multiple'}>
                            <table role='grid'>
                                <thead>
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Quantity</th>
                                        <th scope="col">Price</th>
                                        <th scope="col" className='button-col'><FiPlusCircle className='click' onClick={() => setEditing(Number.MAX_SAFE_INTEGER)} /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <FieldArray name='items'>
                                        {({ remove, push }) => (
                                            <>
                                                <ItemModal
                                                    item={values.items[editing] || {}}
                                                    isOpen={editing >= 0}
                                                    close={() => setEditing(-1)}
                                                    apply={value => updateItem(values.items, push, value)}
                                                    remove={() => remove(editing)}
                                                />

                                                {values.items.map((item, index) => (
                                                    <tr key={item.id} className='click' onClick={() => setEditing(index)}>
                                                        <td>{item.name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{`$${parseFloat(item.price).toFixed(2)}`}</td>
                                                        <td className='button-col'><FiTrash className='click' onClick={e => { remove(index); e.stopPropagation(); }} /></td>
                                                    </tr>
                                                ))}
                                                {values.items.length === 0 &&
                                                    <tr>
                                                        <td height="200px" colSpan="4" valign="center" align="center">
                                                            <div className='click no-items' onClick={() => setEditing(Number.MAX_SAFE_INTEGER)}>
                                                                Tap to add an item...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                }
                                            </>
                                        )
                                        }
                                    </FieldArray>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th scope="col">Subtotal</th>
                                        <td></td>
                                        <td>{displaySubtotal(values)}</td>
                                        <td className='button-col'></td>
                                    </tr>
                                </tfoot>
                            </table>

                            <PercentageAmountSelector name='tax' label='Tax' />
                            <PercentageAmountSelector name='tip' label='Tip' placeholder='Optional' />

                        </Show>

                        <Show when={values.split !== 'individually'}>
                            <Switch name='isSplit' label='Already Split' showTooltip={values.isSplit} tooltip="Everyone has already paid for this expense." />
                        </Show>

                        <button className="contrast" type="submit" onClick={() => onSubmitClicked(errors, values)} disabled={isSubmitting} aria-busy={isSubmitting}>
                            {submitText(values)}
                        </button>
                    </Form>
                )}
            </Formik>
        </Page>
    );
}
import { FiPlusCircle, FiTrash } from 'react-icons/fi';
import { Formik, Form, FieldArray } from 'formik';
import AnimateHeight from 'react-animate-height';
import { useState } from 'react';

import Page from '../../components/Page';
import ItemModal from './ItemModal';
import CloseHeader from '../../components/CloseNav';
import { PercentageAmountSelector } from '../../components/Forms';
import { DefaultExpense, ExpenseSchema } from './schema';
import LabelInput from '../../components/LabelInput';

import './expense.scss';
import toast from 'react-hot-toast';

export default function Expense() {
    function getSplitTooltip(split) {
        switch (split) {
            case 'proportionally': return 'Expense will be split up by salary';
            case 'equally': return 'Expense will be split equally';
            case 'individually': return 'You\'ll pay for this expense yourself.';
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

    function subtotal(values) {
        values = ExpenseSchema.cast(values);
        return values.items.reduce((total, { price, quantity }) => total + price * quantity, 0) || '';
    }

    function grandTotal(values) {
        function evaluatePercentageAmount(current, pa) {
            if (!pa.value) return current;
            switch (pa.type) {
                case 'percentage': return current * (1 + pa.value / 100);
                case 'amount': return current + pa.value;
                default: return current;
            }
        }
        values = ExpenseSchema.cast(values);
        if (values.type === 'single') return values.amount || '';
        let grand = subtotal(values);
        if (!grand) return '';
        grand = evaluatePercentageAmount(grand, values.tax);
        grand = evaluatePercentageAmount(grand, values.tip);
        return grand;
    }

    function onSubmitClicked(errors, values) {
        // Toast no items when no other errors are pending
        if (Object.keys(errors).length === 1 && values.items.length === 0)
            toast.error('Add at least one item!');
    }

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
                initialValues={DefaultExpense}
                validationSchema={ExpenseSchema}
                onSubmit={(values, { setSubmitting }) => {
                    setTimeout(() => {
                        values = ExpenseSchema.cast(values);
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
                }}
            >
                {({ values, touched, errors, isSubmitting }) => (
                    <Form>
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

                        <AnimateHeight height={values.type === 'single' ? 'auto' : 0}>
                            <LabelInput type='text' name='amount' label='Amount' inputMode="decimal" pattern="[0-9.]*"/>
                        </AnimateHeight>

                        <AnimateHeight height={values.type === 'multiple' ? 'auto' : 0}>
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
                                                        <td>{item.price}</td>
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
                                        <td>
                                            {(function () {
                                                const sub = subtotal(values);
                                                if (!sub) return '-';
                                                return `$${sub.toFixed(2)}`;
                                            })()}
                                        </td>
                                        <td className='button-col'></td>
                                    </tr>
                                </tfoot>
                            </table>

                            <PercentageAmountSelector name='tax' label='Tax' />
                            <PercentageAmountSelector name='tip' label='Tip' placeholder='Optional' />

                        </AnimateHeight>

                        {/* <code>{JSON.stringify(errors, null, 2)}</code>
                        <code>{JSON.stringify(values, null, 2)}</code> */}

                        <button className="contrast" type="submit" onClick={() => onSubmitClicked(errors, values)} disabled={isSubmitting} aria-busy={isSubmitting}>
                            {(function () {
                                const grand = grandTotal(values);
                                return `Add Expense${!!grand ? ' • $' + grand.toFixed(2) : ''}`;
                            })()}
                        </button>
                    </Form>
                )}
            </Formik>
        </Page>
    );
}
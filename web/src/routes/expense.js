import { FiCheck, FiPlusCircle, FiTrash } from 'react-icons/fi';
import { Formik, Form, Field, FieldArray } from 'formik';
import Page from '../components/Page';
import { useState } from 'react';
import Modal from 'react-modal';
import { nanoid } from 'nanoid'

import './expense.scss';
import CloseHeader from '../components/CloseNav';

const customModalStyles = {
    overlay: {
        backgroundColor: 'transparent'
    },
    content: {
        border: 'none',
        background: 'none',
        outline: 'none',
        pointerEvents: 'none'
    }
};

const ItemModal = ({ item, isOpen, close, apply, remove }) => {
    const isEditing = !!item.id;

    function submitItem(item) {
        if (!isEditing) item.id = nanoid();
        apply(item);
        close();
    }

    function removeItem() {
        remove();
        close();
    }

    return (
        <Modal
            closeTimeoutMS={200}
            isOpen={isOpen}
            onRequestClose={close}
            style={customModalStyles}
            shouldCloseOnOverlayClick={true}
        >
            <dialog open>
                <article style={{ width: '100%', paddingTop: '30px', paddingBottom: 0 }}>
                    <CloseHeader onClick={() => close()}>
                        <h3>{isEditing ? 'Edit Item' : 'Add Item'}</h3>
                    </CloseHeader>
                    <Formik
                        initialValues={item}
                        validate={values => { }}
                        onSubmit={submitItem}
                    >
                        {() => (
                            <Form>
                                <div className='form-group'>
                                    <label htmlFor='name'>Name</label>
                                    <Field type="text" name='name' placeholder='e.g. Banana, Desk, Camping Gear' required />
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='quantity'>Quantity</label>
                                    <Field type="number" name='quantity' required />
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='price'>Price</label>
                                    <Field type="number" name='price' required />
                                </div>
                                <div className='grid' style={{ marginTop: '30px' }}>
                                    <button type='submit' className="contrast"><FiCheck className='icon' />
                                        {isEditing ? 'Apply' : 'Add Item'}
                                    </button>
                                    {isEditing &&
                                        <button type='button' className="contrast" onClick={removeItem}><FiTrash className='icon' />Remove Item</button>
                                    }
                                </div>
                            </Form>
                        )}
                    </Formik>
                </article>
            </dialog>
        </Modal>
    );
}

export default function Expense() {
    function getSplitTooltip(split) {
        switch (split) {
            case 'proportionally': return 'Expense will be split up by salary';
            case 'equally': return 'Expense will be split equally';
            case 'individually': return 'You\'ll pay for this expense yourself.';
            default: return '';
        }
    }

    const [editing, setEditing] = useState(-1);

    function updateItem(values, pushValue, newItem) {
        for (let i = 0; i < values.length; i++) {
            if (values[i].id === newItem.id) {
                values[i] = newItem;
                return;
            }
        }

        pushValue(newItem);
    }

    function subtotal(items) { return items.reduce((total, item) => total + item.quantity * item.price, 0); }

    function grandTotal(values) {
        let sub = subtotal(values.items);
        if (values.taxType === 'percentage')
            sub *= 1 + (parseFloat(values.tax || 0) / 100);
        else if (values.taxType === 'amount')
            sub += parseFloat(values.tax || 0);
        sub += parseFloat(values.tip || 0);
        return sub;
    }

    return (
        <Page>
            <CloseHeader>
                <hgroup>
                    <h2>Add Expense</h2>
                    <h2>Let's get some basic information about the expense</h2>
                </hgroup>
            </CloseHeader>
            <Formik
                initialValues={{
                    split: 'proportionally',
                    date: '2022-04-30',
                    type: 'single',
                    items: [],
                    taxType: 'percentage',
                    tax: '10.25',
                }}
                validate={values => { }}
                onSubmit={(values, { setSubmitting }) => {
                    setSubmitting(true);
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
                }}
            >
                {({ values, touched, errors, isSubmitting }) => (
                    <Form>
                        <div className='form-group'>
                            <label htmlFor="name">Name</label>
                            <Field type="text" name="name" placeholder="e.g. Groceries, Rent" required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor="date">Date</label>
                            <Field type="date" name="date" required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor="split">Split</label>
                            <Field as="select" name="split" required>
                                <option value="proportionally">Proportionally</option>
                                <option value="equally">Equally</option>
                                <option value="individually">Individually</option>
                            </Field>
                            <small>{getSplitTooltip(values.split)}</small>
                        </div>

                        <div className='form-group'>
                            <label htmlFor="type">Expense Type</label>
                            <Field as="select" name="type" required>
                                <option value="single">Lump Sum</option>
                                <option value="multiple">Multiple Items</option>
                            </Field>
                        </div>

                        {values.type === 'single' &&
                            <div className='form-group'>
                                <label htmlFor="amount">Amount</label>
                                <Field type='number' name='amount' required />
                            </div>
                        }

                        {values.type === 'multiple' &&
                            <>
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
                                            <td>{`$${subtotal(values.items)}`}</td>
                                            <td className='button-col'></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className='grid' style={{ gridTemplateColumns: '1fr 2fr' }}>
                                    <div className='form-group col-4'>
                                        <label htmlFor="taxType">Tax</label>
                                        <Field as='select' name='taxType' required>
                                            <option value="percentage">Percentage</option>
                                            <option value="amount">Flat Fee</option>
                                        </Field>
                                    </div>
                                    <div className='form-group'>
                                        <label htmlFor="tax">{values.taxType === 'percentage' ? 'Percentage' : 'Amount'}</label>
                                        <Field type='number' name='tax' />
                                    </div>
                                </div>

                                <div className='form-group'>
                                    <label htmlFor="tip">Tip</label>
                                    <Field type='number' name='tip' placeholder='Optional' />
                                </div>

                                <h5 style={{marginBottom: '1em'}}>Grand Total • {`$${grandTotal(values)}`}</h5>
                            </>
                        }

                        <button className="contrast" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                            Add Expense
                        </button>
                    </Form>
                )}
            </Formik>
        </Page>
    );
}
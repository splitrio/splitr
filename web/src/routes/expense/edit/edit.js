import { FiPlusCircle, FiTrash } from 'react-icons/fi';
import { Formik, Form, FieldArray } from 'formik';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Page from '../../../components/Page';
import Show from '../../../components/Show';
import ItemModal from './ItemModal';
import CloseHeader from '../../../components/CloseHeader';
import { DefaultExpense, ExpenseSchema } from './schema';
import LabelInput from '../../../components/form/LabelInput';
import PercentageAmountSelector from '../../../components/form/PercentageAmountSelector';

import './edit.scss';
import useAuth from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { defaultsDeep } from 'lodash';
import Loadable from '../../../components/Loadable';
import ImageGallery from '../../../components/ImageGallery';

import { Storage } from 'aws-amplify';
import { v4 as uuid } from 'uuid';

const SHOW_EXPENSE_JSON = false;
const SHOW_EXPENSE_JSON_CASTED = false;

function isNumeric(value) {
    if (typeof value === 'number') return !isNaN(value);
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function computeSubtotal(values) {
    return values.items.reduce((total, { price, quantity }) => total + price * quantity, 0) || null;
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
            case 'percentage':
                return current * (1 + value / 100);
            case 'amount':
                return current + value;
            default:
                return current;
        }
    };

    switch (values.type) {
        case 'single':
            return !isNumeric(values.amount) ? null : parseFloat(values.amount);
        case 'multiple':
            let total = computeSubtotal(values);
            total = parsePercentAmount(total, values.tax);
            total = parsePercentAmount(total, values.tip);
            return total;
        default:
            return null;
    }
}

function submitText(values, isEditing) {
    const total = computeTotal(values);
    const text = isEditing ? 'Update Expense' : 'Add Expense';
    if (!total) return text;
    return `${text}${total ? ' • $' + total.toFixed(2) : ''}`;
}

/**
 * Cleans an existing expense (i.e. one that we are updating)
 * so that it plays nicely with Formik.
 */
function useExistingExpense(users) {
    const auth = useAuth();
    const { state } = useLocation();
    function cleanExpense() {
        let expense = state?.expense;
        if (!expense) return expense;
        expense = defaultsDeep(expense, DefaultExpense());
        if (expense.users.length === users.length) expense.splitWith = [];
        else
            expense.splitWith = expense.users
                .filter(user => user.user !== auth.user().getUsername())
                .map(user => user.user);
        return expense;
    }
    const [cleaned] = useState(cleanExpense());
    return cleaned;
}

function EditExpenseView({ users }) {
    function getSplitTooltip(split) {
        switch (split) {
            case 'proportionally':
                return 'Expense will be split up by salary';
            case 'equally':
                return 'Expense will be split equally';
            case 'individually':
                return "You'll pay for this expense yourself";
            default:
                return '';
        }
    }

    function onSubmitClicked(errors, values) {
        // Toast no items when no other errors are pending
        if (Object.keys(errors).length === 1 && errors.items && values.items.length === 0)
            toast.error('Add at least one item!');
    }

    const auth = useAuth();
    const navigate = useNavigate();

    const [modalItemIndex, setModalItemIndex] = useState(-1);
    const [modalState, setModalState] = useState(ItemModal.States.Closed);

    function updateItem(items, addItem, newItem) {
        if (modalItemIndex >= 0) items[modalItemIndex] = newItem;
        else {
            newItem.id = nanoid();
            addItem(newItem);
        }
    }

    function openItemModal(edittingItemIndex = -1) {
        setModalItemIndex(edittingItemIndex);
        setModalState(ItemModal.States.Open);
    }

    function renderSplitWithLabel({ options }) {
        const maxPeople = 2;
        const numShow = Math.min(maxPeople, options.length);
        const remaining = options.length - numShow;

        let name = '';
        for (let i = 0; i < numShow; i++) {
            const option = options[i];
            name += option.value ? users.find(u => u.user === option.value).firstName : option.text;
            if (i < options.length - 2) name += ', ';
            else name += ' ';
            if (i === options.length - 2 && options.length > 1 && remaining === 0) name += 'and ';
        }

        if (remaining > 0) name += `and ${remaining} ${remaining > 1 ? 'others' : 'other'}`;

        return name;
    }

    // If another page passed an expense object as initial state,
    // then we are updating an expense, not adding one
    const existingExpense = useExistingExpense(users);
    const isEditing = !!existingExpense;

    return (
        <>
            <CloseHeader>
                {isEditing ? (
                    <h2>Edit Expense</h2>
                ) : (
                    <hgroup>
                        <h2>Add Expense</h2>
                        <h2>Let's get some basic information about the expense</h2>
                    </hgroup>
                )}
            </CloseHeader>
            <Formik
                initialValues={existingExpense || DefaultExpense()}
                validationSchema={ExpenseSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        const sanitized = ExpenseSchema.cast(values);

                        // Upload all outstanding images
                        const identityId = (await auth.credentials()).identityId;
                        for (let i = 0; i < sanitized.images.length; i++) {
                            const image = sanitized.images[i];
                            if (!image.startsWith('blob')) continue;

                            // S3 Image keys are of the form [IDENTITY_ID]![UUID]
                            // to allow other clients to find the owning identity id easily
                            const key = `${identityId}!${uuid()}`

                            // TODO: BAD. Creates duplicate copy of image in memory
                            const blob = await fetch(image).then(r => r.blob());
                            const result = await Storage.put(key, blob, {
                                level: 'protected',
                                contentType: blob.type
                            });

                            sanitized.images[i] = result.key;
                        }

                        if (isEditing) await auth.api.put(`/expenses/${existingExpense.id}`, { body: sanitized });
                        else await auth.api.post('/expenses', { body: sanitized });
                        navigate(-1);
                    } catch (e) {
                        toast.error(`Failed to ${isEditing ? 'save' : 'submit'} expense. Try again later.`);
                        setSubmitting(false);
                    }
                }}>
                {({ values, errors, isSubmitting }) => (
                    <Form noValidate>
                        <LabelInput type='text' name='name' label='Name' placeholder='e.g. Groceries, Rent' />
                        <LabelInput type='date' name='date' label='Date' />
                        <LabelInput
                            as='select'
                            name='split'
                            label='Split'
                            tooltip={<small>{getSplitTooltip(values.split)}</small>}>
                            <option value='proportionally'>Proportionally</option>
                            <option value='equally'>Equally</option>
                            <option value='individually'>Individually</option>
                        </LabelInput>
                        <Show when={values.split !== 'individually'}>
                            <LabelInput
                                as='select'
                                name='splitWith'
                                label='Split With'
                                placeholder='Everyone'
                                multiple
                                renderLabel={renderSplitWithLabel}>
                                {users
                                    .filter(user => user.user !== auth.user().getUsername())
                                    .map(user => (
                                        <option key={user.user} value={user.user}>
                                            {user.firstName} {user.lastName}
                                        </option>
                                    ))}
                            </LabelInput>
                        </Show>
                        <LabelInput as='select' name='type' label='Expense Type'>
                            <option value='single'>Lump Sum</option>
                            <option value='multiple'>Multiple Items</option>
                        </LabelInput>

                        <Show when={values.type === 'single'}>
                            <LabelInput
                                type='text'
                                name='amount'
                                label='Amount'
                                inputMode='decimal'
                                pattern='[0-9.]*'
                            />
                        </Show>

                        <Show when={values.type === 'multiple'}>
                            <table role='grid'>
                                <thead>
                                    <tr>
                                        <th scope='col'>Name</th>
                                        <th scope='col'>Quantity</th>
                                        <th scope='col'>Price</th>
                                        <th scope='col' className='button-col'>
                                            <FiPlusCircle className='click' onClick={() => openItemModal()} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <FieldArray name='items'>
                                        {({ remove, push }) => (
                                            <>
                                                <ItemModal
                                                    state={modalState}
                                                    editState={
                                                        modalItemIndex >= 0
                                                            ? ItemModal.EditStates.Editing
                                                            : ItemModal.EditStates.Adding
                                                    }
                                                    item={values.items[modalItemIndex]}
                                                    onClose={() => setModalState(ItemModal.States.Closed)}
                                                    updateItem={updatedItem =>
                                                        updateItem(values.items, push, updatedItem)
                                                    }
                                                    removeItem={() => remove(modalItemIndex)}
                                                />

                                                {values.items.map((item, index) => (
                                                    <tr
                                                        key={item.id}
                                                        className='click'
                                                        onClick={() => openItemModal(index)}>
                                                        <td>{item.name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{`$${parseFloat(item.price).toFixed(2)}`}</td>
                                                        <td className='button-col'>
                                                            <FiTrash
                                                                className='click'
                                                                onClick={e => {
                                                                    remove(index);
                                                                    e.stopPropagation();
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                {values.items.length === 0 && (
                                                    <tr>
                                                        <td height='200px' colSpan='4' valign='center' align='center'>
                                                            <div
                                                                className='click no-items'
                                                                onClick={() => openItemModal()}>
                                                                Tap to add an item...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        )}
                                    </FieldArray>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th scope='col'>Subtotal</th>
                                        <td></td>
                                        <td>{displaySubtotal(values)}</td>
                                        <td className='button-col'></td>
                                    </tr>
                                </tfoot>
                            </table>

                            <PercentageAmountSelector name='tax' label='Tax' />
                            <PercentageAmountSelector name='tip' label='Tip' placeholder='Optional' />
                        </Show>

                        <LabelInput
                            as='textarea'
                            rows='4'
                            type='text'
                            name='notes'
                            label='Notes'
                            placeholder='Tell others more about this expense!'
                        />

                        <ImageGallery form name='images' />

                        <Show when={SHOW_EXPENSE_JSON}>
                            <b>
                                <code>Expense JSON</code>
                            </b>
                            <pre>{JSON.stringify(values, null, 2)}</pre>
                        </Show>

                        <Show when={SHOW_EXPENSE_JSON_CASTED && ExpenseSchema.isValidSync(values)}>
                            <b>
                                <code>Casted Expense JSON</code>
                            </b>
                            <pre>{JSON.stringify(ExpenseSchema.cast(values), null, 2)}</pre>
                        </Show>

                        <button
                            className='contrast'
                            type='submit'
                            onClick={() => onSubmitClicked(errors, values)}
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}>
                            {submitText(values, isEditing)}
                        </button>
                    </Form>
                )}
            </Formik>
        </>
    );
}

export default function EditExpense() {
    const auth = useAuth();
    return (
        <Page>
            <Loadable fetch={() => auth.api.get('/users')}>{users => <EditExpenseView users={users} />}</Loadable>
        </Page>
    );
}

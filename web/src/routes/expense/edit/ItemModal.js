import { FiCheck, FiTrash } from 'react-icons/fi';
import { Formik, Form } from 'formik';
import Modal from '../../../components/Modal';
import CloseHeader from '../../../components/CloseHeader';

import LabelInput from '../../../components/form/LabelInput';
import { DefaultItem, ItemSchema } from './schema';
import UserSelect from '../../../components/form/UserSelect';

export default function ItemModal({ state, editState, item, onClose, updateItem, removeItem, users, selectUsers }) {
    function submit(updatedItem) {
        // If all users are selected, it should be treated as if none were
        if (updatedItem.users.length === users.length)
            updatedItem.users = [];

        updateItem(updatedItem);
        onClose();
    }

    function remove() {
        removeItem();
        onClose();
    }

    return (
        <Modal isOpen={state === ItemModal.States.Open} onClose={onClose}>
            <CloseHeader onClick={onClose}>
                <h3>{editState === ItemModal.EditStates.Adding ? 'Add Item' : 'Edit Item'}</h3>
            </CloseHeader>
            <Formik
                initialValues={editState === ItemModal.EditStates.Adding ? DefaultItem() : item}
                validationSchema={ItemSchema}
                onSubmit={submit}>
                {({ values }) => <Form noValidate>
                    <LabelInput type='text' name='name' label='Name' placeholder='e.g. Banana, Desk, Camping Gear' />
                    <LabelInput type='text' name='quantity' label='Quantity' inputMode='numeric' pattern='[0-9]*' />
                    <LabelInput type='text' name='price' label={`${values.quantity > 1 ? 'Unit ' : ''}Price`} inputMode='decimal' pattern='[0-9.]*' />
                    {selectUsers && <UserSelect
                        users={users}
                        name='users'
                        label='Belongs To'
                        placeholder='Everyone'
                        tooltip={values.users.length > 1 && `Item${values.quantity > 1 ? 's' : ''} will be split up equally`} />}
                    <div className='grid' style={{ marginTop: '30px' }}>
                        <button type='submit' className='contrast'>
                            <FiCheck className='icon' />
                            {editState === ItemModal.EditStates.Adding ? 'Add Item' : 'Apply'}
                        </button>
                        {editState === ItemModal.EditStates.Editing && (
                            <button type='button' className='contrast' onClick={remove}>
                                <FiTrash className='icon' />
                                Remove Item
                            </button>
                        )}
                    </div>
                </Form>}
            </Formik>
        </Modal>
    );
}

ItemModal.States = Object.freeze({
    Closed: 0,
    Open: 1,
});

ItemModal.EditStates = Object.freeze({
    Editing: 1,
    Adding: 2,
});

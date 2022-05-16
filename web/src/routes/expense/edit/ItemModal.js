import { FiCheck, FiTrash } from 'react-icons/fi';
import { Formik, Form } from 'formik';
import Modal from '../../../components/Modal';
import CloseHeader from '../../../components/CloseHeader';

import LabelInput from '../../../components/form/LabelInput';
import { DefaultItem, ItemSchema } from './schema';

export default function ItemModal({ state, editState, item, onClose, updateItem, removeItem }) {
    function submit(updatedItem) {
        updateItem(updatedItem);
        onClose();
    }

    function remove() {
        removeItem();
        onClose();
    }

    return (
        <Modal isOpen={state === ItemModal.States.Open} onClose={onClose} shouldCloseOnOverlayClick={true}>
            <CloseHeader onClick={onClose}>
                <h3>{editState === ItemModal.EditStates.Adding ? 'Add Item' : 'Edit Item'}</h3>
            </CloseHeader>
            <Formik
                initialValues={editState === ItemModal.EditStates.Adding ? DefaultItem() : item}
                validationSchema={ItemSchema}
                onSubmit={submit}>
                <Form noValidate>
                    <LabelInput type='text' name='name' label='Name' placeholder='e.g. Banana, Desk, Camping Gear' />
                    <LabelInput type='string' name='quantity' label='Quantity' inputMode='numeric' pattern='[0-9]*' />
                    <LabelInput type='string' name='price' label='Price' inputMode='decimal' pattern='[0-9.]*' />
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
                </Form>
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

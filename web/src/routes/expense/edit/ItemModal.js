import { FiCheck, FiTrash } from 'react-icons/fi';
import { Formik, Form } from 'formik';
import { nanoid } from 'nanoid'
import Modal from '../../../components/Modal';
import CloseHeader from '../../../components/CloseHeader';

import LabelInput from '../../../components/form/LabelInput';
import { DefaultItem, ItemSchema } from './schema';

export default function ItemModal({ item, isOpen, close, apply, remove }) {
    const isEditing = !!item.id;

    function submitItem(item) {
        if (!isEditing) item.id = nanoid();
        apply(item);
        close();
    }

    function removeItem(e) {
        e.preventDefault();
        remove();
        close();
    }

    return (
        <Modal isOpen={isOpen} onClose={close} shouldCloseOnOverlayClick={true}>
            <CloseHeader onClick={() => close()}>
                <h3>{isEditing ? 'Edit Item' : 'Add Item'}</h3>
            </CloseHeader>
            <Formik
                initialValues={isEditing ? item : DefaultItem()}
                validationSchema={ItemSchema}
                onSubmit={submitItem}
            >
                {({ values, touched, errors }) => (
                    <Form noValidate>
                        <LabelInput type='text' name='name' label='Name' placeholder='e.g. Banana, Desk, Camping Gear' />
                        <LabelInput type='string' name='quantity' label='Quantity' inputMode="numeric" pattern="[0-9]*" />
                        <LabelInput type='string' name='price' label='Price' inputMode="decimal" pattern="[0-9.]*" />

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
        </Modal>
    );
}
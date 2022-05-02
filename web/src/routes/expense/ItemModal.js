import { FiCheck, FiTrash } from 'react-icons/fi';
import { Formik, Form } from 'formik';
import { nanoid } from 'nanoid'
import Modal from 'react-modal';
import CloseHeader from '../../components/CloseNav';

import LabelInput from '../../components/LabelInput';
import { DefaultItem, ItemSchema } from './schema';

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
                        initialValues={isEditing ? item : DefaultItem}
                        validationSchema={ItemSchema}
                        onSubmit={submitItem}
                    >
                        {({values, touched, errors}) => (
                            <Form>
                                <LabelInput type='text' name='name' label='Name' placeholder='e.g. Banana, Desk, Camping Gear' />
                                <LabelInput type='number' name='quantity' label='Quantity' inputMode="numeric" pattern="[0-9]*" />
                                <LabelInput type='text' name='price' label='Price' inputMode="decimal" pattern="[0-9.]*" />

                                <div className='grid' style={{ marginTop: '30px' }}>
                                    <button type='submit' className="contrast"><FiCheck className='icon' />
                                        {isEditing ? 'Apply' : 'Add Item'}
                                    </button>
                                    {isEditing &&
                                        <button type='button' className="contrast" onClick={removeItem}><FiTrash className='icon' />Remove Item</button>
                                    }
                                </div>
                                {/* <code>{JSON.stringify(errors, null, 2)}</code>
                                <code>{JSON.stringify(values, null, 2)}</code>
                                <code>{JSON.stringify(touched, null, 2)}</code> */}
                            </Form>
                        )}
                    </Formik>
                </article>
            </dialog>
        </Modal>
    );
}
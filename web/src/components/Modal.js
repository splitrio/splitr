import ReactModal from 'react-modal';

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

export default function Modal({ onClose, children, ...props }) {
    return <ReactModal
        closeTimeoutMS={200}
        onRequestClose={onClose}
        style={customModalStyles}
        {...props}
    >
        <dialog open>
            <article style={{ width: '100%', paddingTop: '30px', paddingBottom: 0 }}>
                {children}
            </article>
        </dialog>
    </ReactModal>
}
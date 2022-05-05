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

export default function Modal({ isOpen, close, shouldCloseOnOverlayClick=false, children }) {
    return <ReactModal
        closeTimeoutMS={200}
        isOpen={isOpen}
        onRequestClose={close}
        style={customModalStyles}
        shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
        <dialog open>
            <article style={{ width: '100%', paddingTop: '30px', paddingBottom: 0 }}>
                {children}
            </article>
        </dialog>
    </ReactModal>
}
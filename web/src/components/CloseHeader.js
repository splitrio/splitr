import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const buttonStyles = {
    cursor: 'pointer',
    color: 'gray',
    fontSize: 32 + 'px'
};

export default function CloseHeader(props) {
    const navigate = useNavigate();

    function onClick () {
        if (props.onClick) props.onClick();
        else navigate(-1);
    }

    return (
        <nav>
            {props.children || <p />}
            <FiX style={buttonStyles} onClick={onClick} />
        </nav>
    );
}
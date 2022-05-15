import { Fab as TinyFab } from 'react-tiny-fab';
import { FaChevronDown } from 'react-icons/fa';
import { motion } from 'framer-motion';

const animationVariants = {
    initial: { opacity: 0 },
    animate: { opacity: [0, 0, 1], transition: { duration: 0.7 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function Fab({ children, ...props }) {
    return (
        <motion.div initial='initial' animate='animate' exit='exit' variants={animationVariants}>
            <TinyFab
                alwaysShowTitle={true}
                style={{ bottom: '10px', right: '10px' }}
                event={'hover'}
                icon={<FaChevronDown />}
                {...props}>
                {children}
            </TinyFab>
        </motion.div>
    );
}

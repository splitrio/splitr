import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { IoLogoVenmo } from 'react-icons/io5';
import useAuth from '../hooks/useAuth';
import { motion } from 'framer-motion';
import './Page.scss';
import { useState } from 'react';
import ConnectVenmo from './ConnectVenmo';

const pageMotion = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.2 } },
};

export default function Page({ nav, children }) {
    const auth = useAuth();
    const navigate = useNavigate();

    async function signOut() {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (e) {
            toast.error(`Couldn't sign out: ${e.message}`);
        }
    }

    const [showVenmo, setShowVenmo] = useState(ConnectVenmo.States.Closed);

    return (
        <div id='pageContent'>
            <nav className='container-fluid'>
                <ul>
                    <li>
                        <Link to='/' className='contrast'>
                            <strong>splitr</strong>
                        </Link>
                    </li>
                </ul>
                <ul>
                    {nav && <li>{nav}</li>}
                    {auth.user() && (
                        <li className='click' onClick={() => setShowVenmo(ConnectVenmo.States.Open)}>
                            <IoLogoVenmo />
                        </li>
                    )}
                </ul>
            </nav>

            <motion.main
                id='pageMain'
                className='container'
                initial='initial'
                animate='animate'
                exit='exit'
                variants={pageMotion}>
                <article className='grid'>
                    <div id='page'>{children}</div>
                </article>
            </motion.main>

            <ConnectVenmo state={showVenmo} onClose={() => setShowVenmo(ConnectVenmo.States.Closed)} />

            <footer className='container-fluid'>
                <small>
                    Built with{' '}
                    <a href='https://picocss.com' className='secondary'>
                        Pico
                    </a>
                </small>
                {auth.authenticated() && (
                    <small>
                        &nbsp;•{' '}
                        <span onClick={signOut} className='link secondary'>
                            Sign Out
                        </span>
                    </small>
                )}
            </footer>
        </div>
    );
}

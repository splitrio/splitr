import { Link } from 'react-router-dom';
import './Page.scss';

export default function Page(props) {
    return (
        <div id="pageContent">
            <nav className="container-fluid">
                <ul>
                    <li><Link to="/dashboard" className="contrast"><strong>splitr</strong></Link></li>
                </ul>
            </nav>

            <main id="pageMain" className="container">
                <article className="grid">
                    <div id="page">
                        {props.children}
                    </div>
                </article>
            </main>

            <footer className="container-fluid">
                <small>Built with <a href="https://picocss.com" className="secondary">Pico</a></small>
            </footer>
        </div>
    );
}
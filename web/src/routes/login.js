import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';

export default function Login() {
    const navigate = useNavigate();

    const submit = evt => {
        navigate('/dashboard');
        evt.preventDefault();
        return false; 
    }

    return (
        <Page>
            <hgroup>
                <h1 className="title">splitr</h1>
                <h2>A web-app for sharing expenses among friends.</h2>
            </hgroup>
            <form onSubmit={submit}>
                <input type="text" name="login" placeholder="Email" aria-label="Login" autoComplete="nickname" required />
                <input type="password" name="password" placeholder="Password" aria-label="Password" autoComplete="current-password" required />
                <fieldset>
                    <label htmlFor="remember">
                        <input type="checkbox" role="switch" id="remember" name="remember" />
                        Remember me
                    </label>
                </fieldset>
                <button type="submit" className="contrast">Login</button>
            </form>
        </Page>
    );
}
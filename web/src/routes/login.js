import { useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks';

export default function Login() {
    useTitle("Login");
    const navigate = useNavigate();

    function onSubmit() {
        navigate('/dashboard');
    }

    return (
        <>
            <hgroup>
                <h1 className="title">splitr</h1>
                <h2>A web-app for sharing expenses among friends.</h2>
            </hgroup>
            <form onSubmit={onSubmit}>
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
        </>
    );
}
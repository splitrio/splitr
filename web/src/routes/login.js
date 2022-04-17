import './login.scss';

export default function Login() {
    return (
        <>
            <nav class="container-fluid">
                <ul>
                    <li><a href="./" class="contrast" onclick="event.preventDefault()"><strong>splitr</strong></a></li>
                </ul>
            </nav>

            <main class="container">
                <article class="grid">
                    <div>
                        <hgroup>
                            <h1 id="title">splitr</h1>
                            <h2>A minimalist layout for Login pages</h2>
                        </hgroup>
                        <form>
                            <input type="text" name="login" placeholder="Login" aria-label="Login" autocomplete="nickname" required />
                            <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required />
                            <fieldset>
                                <label for="remember">
                                    <input type="checkbox" role="switch" id="remember" name="remember" />
                                    Remember me
                                </label>
                            </fieldset>
                            <button type="submit" class="contrast" onclick="event.preventDefault()">Login</button>
                        </form>
                    </div>
                </article>
            </main>

            <footer class="container-fluid">
                <small>Built with <a href="https://picocss.com" class="secondary">Pico</a></small>
            </footer>
        </>
    )
}
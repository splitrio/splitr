import { Auth } from "aws-amplify";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

function getKey(keyName, defaultValue) {
    let value = localStorage.getItem(keyName);
    if (value === null)
        value = sessionStorage.getItem(keyName);
    if (value === null)
        return defaultValue;
    try {
        return JSON.parse(value);
    } catch {
        return defaultValue;
    }
}

function setKey(keyName, value) {
    value = JSON.stringify(value);

    try {
        localStorage.setItem(keyName, value);
    } catch {
        try {
            sessionStorage.setItem(keyName, value);
        } catch (e) {
            console.log(`Could not set key "${keyName}" in either local or session storage: ${e}`);
        }
    }
}

const RememberMeKey = 'rememberMe';

function configureAuth(rememberMe) {
    Auth.configure({ storage: rememberMe ? localStorage : sessionStorage });
}

async function loadAuth({ setUser, setAuthenticated }) {
    configureAuth(getKey(RememberMeKey, true));
    try {
        const user = await Auth.currentAuthenticatedUser();
        const session = await Auth.currentSession();
        if (session.isValid()) {
            setUser(user);
            setAuthenticated(true);
        }
    }
    catch (e) {
        console.log(`Initial authentication failed: ${e}`);
    }
}

function AuthProvider({ children }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuth({ setUser, setAuthenticated }).then(() => setLoading(false));
    }, []);

    // Show loading indicator while authentication state is loading
    if (loading)
        return (
            <div style={{ width: '100%', height: '100%', textAlign: 'center' }}>
                <span style={{ position: 'relative', top: '50%' }} aria-busy={true} />
            </div>
        );

    const authObject = {
        authenticated: authenticated,

        async signUp(accountInfo) {
            await Auth.signUp({
                username: accountInfo.email,
                password: accountInfo.password,
                attributes: {
                    email: accountInfo.email,
                    given_name: accountInfo.firstName,
                    family_name: accountInfo.lastName,
                    'custom:hourlyWage': accountInfo.hourlyWage,
                    'custom:accessKey': accountInfo.accessKey
                }
            });
        },

        async signIn(email, password, rememberMe) {
            if (authenticated) return;
            setKey(RememberMeKey, rememberMe);
            configureAuth(rememberMe);
            const user = await Auth.signIn(email, password);
            setUser(user);
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED')
                throw new Error('Admin accounts are currently disabled.');
            setAuthenticated(true);
        },

        async updatePassword(newPassword) {
            if (!user) throw new Error('Previous sign in attempt required.');
            await Auth.completeNewPassword(user, newPassword);
            setAuthenticated(true);
        },

        async signOut() {
            if (!authenticated) throw new Error('User was not signed in');
            await Auth.signOut();
            setAuthenticated(false);
            setUser(null);
        }
    };

    return <AuthContext.Provider value={authObject}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
    return useContext(AuthContext);
}

export { AuthProvider };
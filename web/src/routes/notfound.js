import { useNavigate } from 'react-router-dom';
import Page from '../components/Page';

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <Page>
            <hgroup>
                <h1 className='title'>Oops.</h1>
                <h3>It doesn't look like that exists. Go <span onClick={() => navigate('/')} className='link secondary'>home</span>?</h3>
            </hgroup>
        </Page>
    );
}

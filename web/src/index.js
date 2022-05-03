import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import './index.scss';
import Modal from 'react-modal';

import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);
Modal.setAppElement('#root');
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HashRouter><App /></HashRouter>);

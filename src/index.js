import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppV2 from './AppV2';
import TVDashboard from './pages/shared/TVDashboard';
import reportWebVitals from './reportWebVitals';

// TV Dashboard: accessed via ?tv=<token> on any URL
const params = new URLSearchParams(window.location.search);
const tvToken = params.get('tv');
const isTV = tvToken === process.env.REACT_APP_TV_DASHBOARD_TOKEN;

// Feature flag: set REACT_APP_USE_V2=true in .env to use the new architecture
const useV2 = process.env.REACT_APP_USE_V2 === 'true';
const RootApp = isTV ? TVDashboard : (useV2 ? AppV2 : App);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppV2 from './AppV2';
import reportWebVitals from './reportWebVitals';

// Feature flag: set REACT_APP_USE_V2=true in .env to use the new architecture
const useV2 = process.env.REACT_APP_USE_V2 === 'true';
const RootApp = useV2 ? AppV2 : App;

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

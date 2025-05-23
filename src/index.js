import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'react-calendar/dist/Calendar.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import emailjs from '@emailjs/browser';

const root = ReactDOM.createRoot(document.getElementById('root'));

emailjs.init('SkPvagysP-E-rUJ6I');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



reportWebVitals();
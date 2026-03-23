const d = new Date();
const pad = n => String(n).padStart(2,'0');
window.APP_VERSION = 'V2.' + pad(d.getDate()) + '.' + pad(d.getMonth()+1) + '.' + String(d.getFullYear()).slice(-2);

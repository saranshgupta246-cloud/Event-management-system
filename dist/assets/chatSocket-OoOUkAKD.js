import{l as e}from"./index-CyTcV1HU.js";let t=null;function l(){if(t)return t;const o=localStorage.getItem("ems_token");return t=e("http://localhost:5000",{auth:{token:o}}),t}export{l as g};

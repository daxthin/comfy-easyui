import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

export default function Navbar(target) {
    const container = document.createElement("div");
    container.id = "easyui-navbar";
    const content = `
        <button id="queue-btn" class="easyui-tab queue">Queue</button>
        <button id="upload-btn" class="easyui-tab queue">Hello world!</button>
    `


    container.innerHTML = content;
    target.appendChild(container);



}


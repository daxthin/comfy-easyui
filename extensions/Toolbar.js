import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

export default function Toolbar(target) {
    const container = document.createElement("div");
    container.id = "easyui-toolbar";
    const content = `
        <button class="easyui-button toolbar-option">Civitai</button>
        <button class="easyui-button toolbar-option">Downloader</button>
    `
    container.innerHTML = content;
    target.appendChild(container);
}


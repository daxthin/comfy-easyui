import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

export default function Panel(target) {
    const container = document.createElement("div");
    container.className = "panel";
    target.appendChild(container);
    return container;
}


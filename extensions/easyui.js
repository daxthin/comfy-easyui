import { app } from "/scripts/app.js";
import { ComfyApp } from "/scripts/app.js";
import { api } from "/scripts/api.js";

// app.ui.menuContainer.remove();

// components
import Navbar from "./Navbar.js";
import Toolbar from "./Toolbar.js";
import NodePanel from "./Panel.js";
import ImagePreview from "./ImagePreview.js";
import CivitaiPanel from "./CivitaiDownloader.js";


const root = document.createElement("div");
root.id = "EasyUI";
Navbar(root);
ImagePreview(root);
Toolbar(root);




// const title = document.createElement("label")
// title.style.fontFamily = "Segoe UI"
// title.style.fontWeight = 600;
// title.textContent = "Nodes";



app.registerExtension({
    name: 'Comfy.EasyUI.Menu',
    async init(app) {

    },
    async addCustomNodeDefs(defs, app) {

        const unfiltered_categories = [];
        let filtered_categories = [];

        let nodes = []

        for (const key in defs) {
            unfiltered_categories.push(defs[key].category);
            nodes.push([defs[key].name, defs[key].category]);
        }

        filtered_categories = Array.from(new Set(unfiltered_categories));

        // new NodePanel(root, filtered_categories, nodes);


        new CivitaiPanel(root);

    },
    async setup(app) {
        const qq = document.getElementById("queue-btn");
        qq.addEventListener("click", () => {
            app.queuePrompt(0, 1)
        })
    }
})

document.body.appendChild(root);






import { app } from "/scripts/app.js";
import { ComfyApp } from "/scripts/app.js";
import { api } from "/scripts/api.js";

// app.ui.menuContainer.remove();

// components
import Navbar from "./Navbar.js";
import Toolbar from "./Toolbar.js";
import Panel from "./Panel.js";
import ImagePreview from "./ImagePreview.js";


const root = document.createElement("div");
root.id = "EasyUI";
Navbar(root);
ImagePreview(root);
Toolbar(root);


const node_panel = Panel(root);
node_panel.style.overflowY = "scroll"
// const title = document.createElement("label")
// title.style.fontFamily = "Segoe UI"
// title.style.fontWeight = 600;
// title.textContent = "Nodes";

function generateRandomColor() {
    const colorComponent = () => Math.floor(Math.random() * 150); // Generate a random number between 0 and 255
    const r = colorComponent();
    const g = colorComponent();
    const b = colorComponent();
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function addNodeButton(name, target) {

    const btn = document.createElement("div")
    btn.className = "node-btn"
    btn.style.backgroundColor = generateRandomColor();
    btn.style.fontFamily = "Segoe UI"
    btn.style.minWidth = "150px";
    btn.style.minHeight = "30px";
    btn.style.display = "flex"
    btn.style.justifyContent = "center"
    btn.style.alignItems = "center"
    btn.style.fontWeight = "600"
    btn.style.padding = "4px"
    btn.style.fontSize = "13px"
    btn.style.userSelect = "none"
    btn.textContent = name
    target.appendChild(btn);

    let isDragging = false;
    let offset = { x: 0, y: 0 };

    btn.addEventListener("mousedown", (e) => {
        isDragging = true;
        // offset = { x: e.offsetX, y: e.offsetY };

        const clone = btn.cloneNode(true);
        clone.className = "draggable"
        clone.style.zIndex = "9999";
        clone.style.backgroundColor = "#e74c3c";
        document.body.appendChild(clone);



        document.addEventListener("mousemove", onMouseMove);
    });

    document.addEventListener("mouseup", (e) => {
        if (isDragging) {
            isDragging = false;

            const clone = document.body.querySelector(".draggable");
            var node = LiteGraph.createNode(name);
            node.pos = app.canvas.convertEventToCanvasOffset(e);
            app.graph.add(node);

            clone.remove();
            document.removeEventListener("mousemove", onMouseMove);
        }
    });

    function onMouseMove(e) {
        if (isDragging) {
            const x = e.clientX - offset.x;
            const y = e.clientY - offset.y;
            


            const clone = document.body.querySelector(".draggable:last-child");



            setTimeout(() => {
                clone.style.left = `${x-(clone.offsetWidth/2)+10}px`;
                clone.style.top = `${y-(clone.offsetHeight/2)+10}px`;
            }, 60);

        }
    }
}

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

        filtered_categories.forEach(element => {
            const container = document.createElement("div")
            container.className = element + " category"

            const btn = document.createElement("div")
            btn.className = "categories"
            btn.style.fontFamily = "Segoe UI"


            btn.style.minHeight = "10px";
            btn.style.display = "flex"
            btn.style.justifyContent = "center"
            btn.style.alignItems = "center"
            btn.style.fontWeight = "600"
            // btn.style.padding = "4px"
            btn.style.fontSize = "15px"
            btn.style.userSelect = "none"
            btn.textContent = element.toUpperCase();
            container.appendChild(btn);
            node_panel.appendChild(container);




        });

        const categories_element = document.querySelectorAll(".category");
        categories_element.forEach((element, index) => {
            if (element.className.includes(filtered_categories[index])) {

            }

            nodes.forEach(node => {
                if (element.className.includes(node[1])) {
                    addNodeButton(node[0], element);
                }
            })
        })

    },
    async setup(app) {
        const qq = document.getElementById("queue-btn");
        qq.addEventListener("click", () => {
            app.queuePrompt(0, 1)
        })
    }
})

document.body.appendChild(root);






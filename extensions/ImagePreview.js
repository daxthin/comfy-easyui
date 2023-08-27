import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

export default function ImagePreview(target) {
    const container = document.createElement("div");
    container.className = "image-preview";

    const dragHandler = document.createElement("div");
    dragHandler.className = "drag-handler";

    container.appendChild(dragHandler)

    const faces = {
        // SW: ['bottom: 0; right: 0;  width: 10px; height: 10px; z-index: 100'],
        SE: ['bottom: 0; right: 0;  width: 10px; height: 10px; z-index: 100']
    };

    for (const key in faces) {
        const handler = document.createElement("div");
        handler.className = key.toLowerCase() + " image-handler";
        handler.style = `${faces[key]}; cursor:${key.toLowerCase()}-resize;`;
        console.log(`${faces[key]}; cursor:${key.toLowerCase()}-resize;`);
        container.appendChild(handler);
    }

    const image = document.createElement("img");
    image.className = "image-preview-display";
    image.draggable = false;
    image.src = "";

    // drag window
    let isResizing = false;
    let offsetX, offsetY;
    let isDragging = false;
    dragHandler.addEventListener("mousedown", function (event) {
        if (event.target.className == "drag-handler") {
            isDragging = true;
            offsetX = event.clientX - container.getBoundingClientRect().left;
            offsetY = event.clientY - container.getBoundingClientRect().top;
        }
    });

    document.addEventListener("mousemove", function (event) {
        if (!isDragging) return;
        let newX = event.clientX - offsetX;
        let newY = event.clientY - offsetY;
        let maxX = window.innerWidth - container.clientWidth;
        let maxY = window.innerHeight - container.clientHeight;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        container.style.left = newX + "px";
        container.style.top = newY + "px";

    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
    });

    // resize window
    document.addEventListener('mousedown', (e) => {
        if (e.target.className.includes("image-handler")) {
            isResizing = true;
            const initialX = e.clientX;
            const initialY = e.clientY;

            const initialWidth = parseFloat(getComputedStyle(container).width);
            const initialHeight = parseFloat(getComputedStyle(container).height);

            document.addEventListener('mousemove', resizeElement);
            document.addEventListener('mouseup', stopResize);

            function resizeElement(e) {
                if (!isResizing) return;
                const deltaX = e.clientX - initialX;
                const deltaY = e.clientY - initialY;
                const newWidth = initialWidth + deltaX;
                console.log(image.height);
                const newHeight = initialHeight + deltaY;
                container.style.width = `${newWidth}px`;
                container.style.height = `${newHeight}px`;
            }
            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', resizeElement);
                document.removeEventListener('mouseup', stopResize);
            }
        }
    });

    api.addEventListener("executed", ({ detail }) => {
        console.log(detail);
        const src = detail.output.images[0];
        const href = `/view?filename=${encodeURIComponent(src.filename)}&type=${src.type
            }&subfolder=${encodeURIComponent(src.subfolder)}&t=${+new Date()}`;
        image.src = href;
    });

    container.appendChild(image);

    target.appendChild(container);
}

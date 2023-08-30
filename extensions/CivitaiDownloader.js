import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

export default class CivitaiPanel {
    constructor(target) {
        this.container = document.createElement("div");
        this.container.className = "civitai-panel panel";
        this.title = document.createElement("label");
        this.title.textContent = "Civitai Downloader";
        this.title.className = "civitai-panel-label";
        this.input = document.createElement("input");
        this.input.className = "easyui-text-input";
        this.input.type = "text";

        this.value = "";
        this.api_host = location.host;
        this.api_base = location.pathname.split('/').slice(0, -1).join('/');
        this.downloadBtn = document.createElement("button");
        this.downloadBtn.textContent = "download";
        this.downloadBtn.className = "easyui-button";
        this.info = "";
        this.container.appendChild(this.title)
        this.match = false;
        // this.input.value = localStorage.getItem("model_id")


        this.infoLabel = document.createElement("label")
        this.infoLabel.className = "debug-text";
        this.infoLabel.style.lineHeight = "2";

        this.errorLabel = document.createElement("label")
        this.errorLabel.className = "debug-text";
        this.errorLabel.style.lineHeight = "2";
        this.errorLabel.classList.add("error");

        this.statusLabel = document.createElement("label")
        this.statusLabel.className = "status-text";
        this.statusLabel.style.lineHeight = "2";

        this.progressBar = document.createElement("progress");
        this.progressBar.className = "easyui-progressbar";
        this.progressBarPercent = document.createElement("span");
        this.progressBarPercent.className = "download-percent"

        this.statusLabel.innerHTML = `
                            <label class="debug-text success">Status:</label> <label class="debug-text">idle</label>
                    `;
        this.infoLabel.innerHTML = `
                            <p class="download-info">Information</p>
                            <label class="debug-text success">Name:</label> none
                            <br>
                            <label class="debug-text success">ID:</label> none
                            <br>
                            <label class="debug-text success">Version:</label> none
                            <br>
                            <label class="debug-text success">Type:</label> none
                    `;



        this.progressBar.value = 0;
        this.progressBar.max = 1;
        this.progressBar.min = 0;


        this.input.addEventListener("input", (e) => {
            this.value = e.target.value;
        })

        setInterval(async () => {
            const response = await fetch(`https://${this.api_host}${this.api_base}/civitai_download_progress`);

            const data = await response.json();
      
            if (data.completed) {
                this.statusLabel.innerHTML = `<label class="debug-text success">Status:</label> <label class="debug-text">idle</label>`;
                this.progressBar.value = 0;
                this.progressBarPercent.textContent = "0%";
            } else {
                const progress = (data.total !== 0 ? (data.current / data.total) * 100 : 0).toFixed(2);
                this.statusLabel.innerHTML = `<label class="debug-text success">Status:</label> <label class="debug-text">downloading</label>`;

                this.progressBar.value = progress;
                this.progressBar.max = 100;
                this.progressBar.min = 0;
                this.progressBarPercent.textContent = progress + "%";

                this.infoLabel.innerHTML = `
                        <p class="download-info">Information</p>
                        <label class="debug-text success">Name:</label> ${data.model_name.replace(/\.[^/.]+$/, "")}
                        <br>
                        <label class="debug-text success">ID:</label> ${data.id}
                        <br>
                        <label class="debug-text success">Version:</label> ${data.version}
                        <br>
                        <label class="debug-text success">Type:</label> ${data.type}
                `;
            }

        }, 100);


        this.downloadBtn.addEventListener("click", async (event) => {
            const aid_pattern = /^(\d+)@(\d+)$/;
            this.match = this.value.match(aid_pattern);

            if (this.match) {
                const id = parseInt(this.match[1]);
                const version = parseInt(this.match[2]);
                console.log(`model id: ${id} model version: ${version}`);
                // localStorage.setItem("model_id", this.value)
                this.errorLabel.innerHTML = "";
                this.input.value = "";
                try {
                    const response = await fetch("/civitai_download", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, version: version })
                    });
                } catch (error) {
                    console.error('error on post:', error);
                }

            } else {
                this.errorLabel.innerHTML = `invalid AID format "${this.value}"`;
            }
        })

        this.container.appendChild(this.input);

        this.container.appendChild(this.errorLabel);

        this.container.appendChild(this.downloadBtn);

        this.container.appendChild(this.progressBar);

        this.container.appendChild(this.progressBarPercent);

        this.container.appendChild(this.infoLabel);

        this.container.appendChild(this.statusLabel);




        this.handleInfo(this.container, this.info);

        target.appendChild(this.container);


    }

    handleInfo(target, info) {







    }


    /**
 * Creates and connects a WebSocket for realtime updates
 * @param {boolean} isReconnect If the socket is connection is a reconnect attempt
 */

}



// this.errorLabel.classList.remove("error");

// this.errorLabel.classList.add("error");
// this.errorLabel.classList.remove("success");
// this.errorLabel.textContent = `invalid AID format "${this.value}"`;
import { app } from '../../scripts/app.js';
import { api } from '/scripts/api.js';
import { ComfyWidgets } from '/scripts/widgets.js';



const ext = {
    // Unique name for the extension
    name: 'Comfy.EasyUI.IO.Nodes',
	async beforeRegisterNodeDef(nodeType, nodeData, app) {


	},

	async setup(app) {

	},

	nodeCreated(node, app) {
        if (node.comfyClass.includes('EasyUI_ControlNet')) {
            ComfyWidgets.IMAGEUPLOAD(node, "image", [], app)
		}
        if (node.comfyClass.includes('EasyUISampler')) {


		}
	}
};

app.registerExtension(ext);

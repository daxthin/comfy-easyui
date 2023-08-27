import { app } from "/scripts/app.js";

const palette = {
	"easyui": {
		"id": "easyui",
		"name": "EasyUI",
		"colors": {
			"node_slot": {
				"CLIP": "#f1fa8c", // bright yellow
				"CLIP_VISION": "#A8DADC", // light blue-gray
				"CLIP_VISION_OUTPUT": "#ad7452", // rusty brown-orange
				"CONDITIONING": "#ffb86c", // vibrant orange-yellow
				"CONTROL_NET": "#f1fa8c", // soft mint green
				"IMAGE": "#8be9fd", // bright sky blue
				"LATENT": "#ff79c6", // light pink-purple
				"MASK": "#50fa7b", // muted green
				"MODEL": "#bd93f9", // light lavender-purple
				"STYLE_MODEL": "#C2FFAE", // light green-yellow
				"VAE": "#ff5555", // bright red
				"TAESD": "#DCC274", // cheesecake
			},
			"litegraph_base": {
				"BACKGROUND_IMAGE": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCzIhnAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAMUExURQYGBggICAcHBwsLCy4s5AsAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABSSURBVFjD7dE7FQAgDATBWAgOCBLOvzc+BnhQUJBNcd02Gbs5dy91TmzH15hpXDsZkidJnB5PFvp5P/ZTgj766KOPfrYEffTRRx/9bAn6WROpAwAocVwU0U8KAAAAAElFTkSuQmCC",
				"CLEAR_BACKGROUND_COLOR": "#0d0d0f",
				"NODE_TITLE_COLOR": "#999",
				"NODE_SELECTED_TITLE_COLOR": "#FFF",
				"NODE_TEXT_SIZE": 14,
				"NODE_TEXT_COLOR": "#BBB",
				"NODE_SUBTEXT_SIZE": 12,
				"NODE_DEFAULT_COLOR": "#26262B",
				"NODE_DEFAULT_BGCOLOR": "#222226",
				"NODE_DEFAULT_BOXCOLOR": "#666",
				"NODE_DEFAULT_SHAPE": "box",
				"NODE_BOX_OUTLINE_COLOR": "#fff",
				"DEFAULT_SHADOW_COLOR": "rgba(0,0,0,0.5)",
				"DEFAULT_GROUP_FONT": 24,

				"WIDGET_BGCOLOR": "#0D0D0F",
				"WIDGET_OUTLINE_COLOR": "transparent",
				"WIDGET_TEXT_COLOR": "#DDD",
				"WIDGET_SECONDARY_TEXT_COLOR": "#999",

				"LINK_COLOR": "#9A9",
				"EVENT_LINK_COLOR": "#A86",
				"CONNECTING_LINK_COLOR": "#AFA",
			},
			"comfy_base": {
				"fg-color": "#fff",
				"bg-color": "#202020",
				"comfy-menu-bg": "#28282E",
				"comfy-input-bg": "#41414D",
				"input-text": "#ddd",
				"descrip-text": "#999",
				"drag-text": "#ccc",
				"error-text": "#ff4444",
				"border-color": "#363640",
				"tr-even-bg-color": "#222",
				"tr-odd-bg-color": "#353535",
			}
		},
	},
}

app.registerExtension({
	name: "Comfy.EasyUI.ColorPalette",
	async init(app) {
		// remove color palette extension
		app.extensions.forEach((extension, index) => {
			if (extension.name === "Comfy.ColorPalette")
				app.extensions.splice(index, 1);
		})

		const colorPalette = palette.easyui;
		if (colorPalette.colors) {
			if (colorPalette.colors.node_slot) {
				Object.assign(app.canvas.default_connection_color_byType, colorPalette.colors.node_slot);
				Object.assign(LGraphCanvas.link_type_colors, colorPalette.colors.node_slot);
			}
			if (colorPalette.colors.litegraph_base) {
				app.canvas.node_title_color = colorPalette.colors.litegraph_base.NODE_TITLE_COLOR;
				app.canvas.default_link_color = colorPalette.colors.litegraph_base.LINK_COLOR;

				for (const key in colorPalette.colors.litegraph_base) {
					if (colorPalette.colors.litegraph_base.hasOwnProperty(key) && LiteGraph.hasOwnProperty(key)) {
						LiteGraph[key] = colorPalette.colors.litegraph_base[key];
					}
				}
			}
			if (colorPalette.colors.comfy_base) {
				const rootStyle = document.documentElement.style;
				for (const key in colorPalette.colors.comfy_base) {
					rootStyle.setProperty('--' + key, colorPalette.colors.comfy_base[key]);
				}
			}
			app.canvas.draw(true, true);
		}

		let { BACKGROUND_IMAGE, CLEAR_BACKGROUND_COLOR } = colorPalette.colors.litegraph_base;
		app.canvas.updateBackground(BACKGROUND_IMAGE, CLEAR_BACKGROUND_COLOR);
	}

});

const theme = {
	name: "Comfy.CustomColorPalettes",
	async init(app) {

	},
}

app.registerExtension(theme)


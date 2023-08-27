import { app } from "/scripts/app.js";

const radius = 2;
const render_shadows = false;
const shadow_intensity = "0.8";
const render_connections_border = false;
// const node_widget_height = 35;
const shadow_color = "0, 0, 0";
const node_widget_margin = 15;

app.registerExtension({
    name: "Comfy.EasyUI.LitegraphTheme",
    async setup(app) {
        // LiteGraph properties
        LiteGraph.DEFAULT_SHADOW_COLOR = `rgba(${shadow_color}, ${shadow_intensity})`;
        // LiteGraph.NODE_WIDGET_HEIGHT = node_widget_height;

        // canvas properties
        app.canvas.links_render_mode = LiteGraph.LINEAR_LINK;
        app.canvas.clear_background_color = "#0d0d0f";

        app.canvas.render_connections_shadows = false;
        app.canvas.allow_dragnodes = true;

        app.canvas.round_radius = radius;
        app.canvas.render_connections_border = render_connections_border;
        app.canvas.render_shadows = render_shadows;

         /**
         * draws some useful stats in the corner of the canvas
         * @method renderInfo
         **/
        LGraphCanvas.prototype.renderInfo = function(ctx, x, y) {
            x += 40;
            x = x || 10;
            y = y || this.canvas.offsetHeight - 80;

            ctx.save();
            ctx.translate(x, y);

            ctx.font = "10px Arial";
            ctx.fillStyle = "#888";
            ctx.textAlign = "left";
            if (this.graph) {
                ctx.fillText( "T: " + this.graph.globaltime.toFixed(2) + "s", 5, 13 * 1 );
                ctx.fillText("I: " + this.graph.iteration, 5, 13 * 2 );
                ctx.fillText("N: " + this.graph._nodes.length + " [" + this.visible_nodes.length + "]", 5, 13 * 3 );
                ctx.fillText("V: " + this.graph._version, 5, 13 * 4);
                ctx.fillText("FPS:" + this.fps.toFixed(2), 5, 13 * 5);
            } else {
                ctx.fillText("No graph selected", 5, 13 * 1);
            }
            ctx.restore();
        };

        LGraphCanvas.prototype.drawNodeWidgets = function(
            node,
            posY,
            ctx,
            active_widget
        ) {
            if (!node.widgets || !node.widgets.length) {
                return 0;
            }
            var width = node.size[0];
            var widgets = node.widgets;
            posY += 2;
            var H = LiteGraph.NODE_WIDGET_HEIGHT;
            var show_text = this.ds.scale > 0.5;
            ctx.save();
            ctx.globalAlpha = this.editor_alpha;
            var outline_color = LiteGraph.WIDGET_OUTLINE_COLOR;
            var background_color = LiteGraph.WIDGET_BGCOLOR;
            var text_color = LiteGraph.WIDGET_TEXT_COLOR;
            var secondary_text_color = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
            var margin = 15;
    
            for (var i = 0; i < widgets.length; ++i) {
                var w = widgets[i];
                var y = posY;
                if (w.y) {
                    y = w.y;
                }
                w.last_y = y;
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = "#222";
                ctx.textAlign = "left";
                //ctx.lineWidth = 2;
                if(w.disabled)
                    ctx.globalAlpha *= 0.5;
                var widget_width = w.width || width;
    
                switch (w.type) {
                    case "button":
                        ctx.fillStyle = background_color;
                        if (w.clicked) {
                            ctx.fillStyle = "#AAA";
                            w.clicked = false;
                            this.dirty_canvas = true;
                        }
                        ctx.fillRect(margin, y, widget_width - margin * 2, H);
                        if(show_text && !w.disabled)
                            ctx.strokeRect( margin, y, widget_width - margin * 2, H );
                        if (show_text) {
                            ctx.textAlign = "center";
                            ctx.fillStyle = text_color;
                            ctx.fillText(w.label || w.name, widget_width * 0.5, y + H * 0.1);
                        }
                        break;
                    case "toggle":
                        ctx.textAlign = "left";
                        ctx.strokeStyle = outline_color;
                        ctx.fillStyle = background_color;
                        ctx.beginPath();
                        if (show_text)
                            ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.1]);
                        else
                            ctx.rect(margin, y, widget_width - margin * 2, H );
                        ctx.fill();
                        if(show_text && !w.disabled)
                            ctx.stroke();
                        ctx.fillStyle = w.value ? "#89A" : "#333";
                        ctx.beginPath();
                        ctx.arc( widget_width - margin * 2, y + H * 0.5, H * 0.36, 0, Math.PI * 2 );
                        ctx.fill();
                        if (show_text) {
                            ctx.fillStyle = secondary_text_color;
                            const label = w.label || w.name;    
                            if (label != null) {
                                ctx.fillText(label, margin * 2, y + H * 0.7);
                            }
                            ctx.fillStyle = w.value ? text_color : secondary_text_color;
                            ctx.textAlign = "right";
                            ctx.fillText(
                                w.value
                                    ? w.options.on || "true"
                                    : w.options.off || "false",
                                widget_width - 40,
                                y + H * 0.7
                            );
                        }
                        break;
                    case "slider":
                        ctx.fillStyle = background_color;
                        ctx.fillRect(margin, y, widget_width - margin * 2, H);
                        var range = w.options.max - w.options.min;
                        var nvalue = (w.value - w.options.min) / range;
                        if(nvalue < 0.0) nvalue = 0.0;
                        if(nvalue > 1.0) nvalue = 1.0;
                        ctx.fillStyle = w.options.hasOwnProperty("slider_color") ? w.options.slider_color : (active_widget == w ? "#89A" : "#678");
                        ctx.fillRect(margin, y, nvalue * (widget_width - margin * 2), H);
                        if(show_text && !w.disabled)
                            ctx.strokeRect(margin, y, widget_width - margin * 2, H);
                        if (w.marker) {
                            var marker_nvalue = (w.marker - w.options.min) / range;
                            if(marker_nvalue < 0.0) marker_nvalue = 0.0;
                            if(marker_nvalue > 1.0) marker_nvalue = 1.0;
                            ctx.fillStyle = w.options.hasOwnProperty("marker_color") ? w.options.marker_color : "#AA9";
                            ctx.fillRect( margin + marker_nvalue * (widget_width - margin * 2), y, 2, H );
                        }
                        if (show_text) {
                            ctx.textAlign = "center";
                            ctx.fillStyle = text_color;
                            ctx.fillText(
                                w.label || w.name + "  " + Number(w.value).toFixed(
                                                                w.options.precision != null
                                                                    ? w.options.precision
                                                                    : 3
                                                            ),
                                widget_width * 0.5,
                                y + H * 0.7
                            );
                        }
                        break;
                    case "number":
                    case "combo":
                        ctx.textAlign = "left";
                        ctx.strokeStyle = outline_color;
                        ctx.fillStyle = background_color;
                        ctx.beginPath();
                        if(show_text)
                            ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.1] );
                        else
                            ctx.rect(margin, y, widget_width - margin * 2, H );
                        ctx.fill();
                        if (show_text) {
                            if(!w.disabled)
                                ctx.stroke();
                            ctx.fillStyle = text_color;
                            if(!w.disabled)
                            {
                                ctx.beginPath();
                                ctx.moveTo(margin + 16, y + 5);
                                ctx.lineTo(margin + 6, y + H * 0.5);
                                ctx.lineTo(margin + 16, y + H - 5);
                                ctx.fill();
                                ctx.beginPath();
                                ctx.moveTo(widget_width - margin - 16, y + 5);
                                ctx.lineTo(widget_width - margin - 6, y + H * 0.5);
                                ctx.lineTo(widget_width - margin - 16, y + H - 5);
                                ctx.fill();
                            }
                            ctx.fillStyle = secondary_text_color;
                            ctx.fillText(w.label || w.name, margin * 2 + 5, y + H * 0.7);
                            ctx.fillStyle = text_color;
                            ctx.textAlign = "right";
                            if (w.type == "number") {
                                ctx.fillText(
                                    Number(w.value).toFixed(
                                        w.options.precision !== undefined
                                            ? w.options.precision
                                            : 3
                                    ),
                                    widget_width - margin * 2 - 20,
                                    y + H * 0.7
                                );
                            } else {
                                var v = w.value;
                                if( w.options.values )
                                {
                                    var values = w.options.values;
                                    if( values.constructor === Function )
                                        values = values();
                                    if(values && values.constructor !== Array)
                                        v = values[ w.value ];
                                }
                                ctx.fillText(
                                    v,
                                    widget_width - margin * 2 - 20,
                                    y + H * 0.7
                                );
                            }
                        }
                        break;
                    case "string":
                    case "text":
                        ctx.textAlign = "left";
                        ctx.strokeStyle = outline_color;
                        ctx.fillStyle = background_color;
                        ctx.beginPath();
                        if (show_text)
                            ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.1]);
                        else
                            ctx.rect( margin, y, widget_width - margin * 2, H );
                        ctx.fill();
                        if (show_text) {
                            if(!w.disabled)
                                ctx.stroke();
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(margin, y, widget_width - margin * 2, H);
                            ctx.clip();
    
                            //ctx.stroke();
                            ctx.fillStyle = secondary_text_color;
                            const label = w.label || w.name;	
                            if (label != null) {
                                ctx.fillText(label, margin * 2, y + H * 0.7);
                            }
                            ctx.fillStyle = text_color;
                            ctx.textAlign = "right";
                            ctx.fillText(String(w.value).substr(0,30), widget_width - margin * 2, y + H * 0.7); //30 chars max
                            ctx.restore();
                        }
                        break;
                    default:
                        if (w.draw) {
                            w.draw(ctx, node, widget_width, y, H);
                        }
                        break;
                }
                posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4;
                ctx.globalAlpha = this.editor_alpha;
    
            }
            ctx.restore();
            ctx.textAlign = "left";
        };
        
    },
});

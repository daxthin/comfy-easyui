from .easyui_nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# import shutil
# css = "./custom_nodes/EasyUI/web/easyui.css"

# web_path = "./web/"

# shutil.copy(css, web_path+"easyui.css")



# with open('./web/index.html', 'r') as f:
#     original_line = '<link rel="stylesheet" type="text/css" href="./style.css" />'
#     new_line = '<link rel="stylesheet" type="text/css" href="./easyui.css" />'
#     content = f.read()

#     pos = content.find(new_line)

#     if pos == -1:
#         if content != new_line:
#             new_html_content = content.replace(original_line, 
#                                     f'{original_line}\n\t\t{new_line}')    

#             with open(f'{web_path}index.html.backup', 'w') as html:
#                 html.write(content)
#             with open(f'{web_path}index.html', 'w') as new_html:
#                 new_html.write(new_html_content)


__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']
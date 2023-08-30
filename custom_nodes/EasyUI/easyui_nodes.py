import os
import torch
import comfy.diffusers_load
import comfy.samplers
import comfy.sample
import comfy.sd
import comfy.utils
import comfy.clip_vision
import latent_preview
import folder_paths
import numpy as np
from comfy import model_management
from comfy_extras.chainner_models import model_loading
MAX_RESOLUTION = 8192
import re
from PIL import Image, ImageOps
from PIL.PngImagePlugin import PngInfo


def common_ksampler(model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent, denoise=1.0, disable_noise=False, start_step=None, last_step=None, force_full_denoise=False):
    device = comfy.model_management.get_torch_device()
    latent_image = latent["samples"]
    

    if disable_noise:
        noise = torch.zeros(latent_image.size(), dtype=latent_image.dtype, layout=latent_image.layout, device="cpu")
    else:
        batch_inds = latent["batch_index"] if "batch_index" in latent else None
        noise = comfy.sample.prepare_noise(latent_image, seed, batch_inds)

    noise_mask = None
    if "noise_mask" in latent:
        noise_mask = latent["noise_mask"]

    preview_format = "JPEG"
    if preview_format not in ["JPEG", "PNG"]:
        preview_format = "JPEG"

    previewer = latent_preview.get_previewer(device, model.model.latent_format)

    pbar = comfy.utils.ProgressBar(steps)
    def callback(step, x0, x, total_steps):
        preview_bytes = None
        if previewer:
            preview_bytes = previewer.decode_latent_to_preview_image(preview_format, x0)
        pbar.update_absolute(step + 1, total_steps, preview_bytes)

    samples = comfy.sample.sample(model, noise, steps, cfg, sampler_name, scheduler, positive, negative, latent_image,
                                  denoise=denoise, disable_noise=disable_noise, start_step=start_step, last_step=last_step,
                                  force_full_denoise=force_full_denoise, noise_mask=noise_mask, callback=callback, seed=seed)
    out = latent.copy()
    out["samples"] = samples
    return (out, )


class EasyUI_Prompt:
    @classmethod
    def INPUT_TYPES(s):
                return {"required":
                    {
                     "ckpt_name": (folder_paths.get_filename_list("checkpoints"), ),
                     "vae_name": (folder_paths.get_filename_list("vae") + ["none"], ),
                     "clip_skip": ("INT", {"default": 1, "min": 1, "max": 24, "step": 1}),
                     "text_a": ("STRING", {"multiline": True}),
                     "text_b": ("STRING", {"multiline": True})
                    },
                }

    RETURN_TYPES = ("MODEL", "VAE", "CONDITIONING","CONDITIONING",)
    RETURN_NAMES = ("MODEL", "VAE", "positive", "negative",)
    FUNCTION = "prompt"

    CATEGORY = "easyui"

    def prompt(self, ckpt_name, vae_name, clip_skip, text_a, text_b):
        
        out = load_checkpoint(ckpt_name)

        model = out[0]
        clip = out[1]

        # set clip layer
        new_clip = clip.clone()
        new_clip.clip_layer(-clip_skip)
        
        # load custom vae
        if vae_name == "none":
             vae = out[2]
        else:
             vae = load_vae(vae_name);

        # find loras in prompt to make a stack
        lora_pattern = r'<lora:([^:]+):([^>]+)>'

        lora_stack = re.findall(lora_pattern, text_a)

        loras = ["None"] + folder_paths.get_filename_list("loras")
        
        if lora_stack:
            # Initialise the list
            lora_params = list()

            # Extend lora_params with lora-stack items 
            lora_params.extend(lora_stack)

            # Initialise the model and clip
            model_lora = model
            clip_lora = new_clip

            # Loop through the list
            for tup in lora_params:
                lora_name, strength_model = tup
                lora_name = lora_name+".safetensors"         
                if lora_name in loras:
                    lora_path = folder_paths.get_full_path("loras", lora_name)
                    lora = comfy.utils.load_torch_file(lora_path, safe_load=True)
                    model_lora, clip_lora = comfy.sd.load_lora_for_models(model_lora, clip_lora, lora, float(strength_model), 1)  
                    print(f"Lora {lora_name} loaded into stack")
                else:
                    print(f"Lora {lora_name} not found")
            model = model_lora
            positive = clip_text_encode(clip_lora, text_a)
            negative = clip_text_encode(clip_lora, text_b)
        else:    
            positive = clip_text_encode(new_clip, text_a)
            negative = clip_text_encode(new_clip, text_b)

        return (model, vae, positive, negative)

class LatentBoolean:
    @classmethod
    def INPUT_TYPES(s):
                return {"required":
                    {"latent": ("LATENT",),
                     "boolean": ("INT",{"default": 0, "min": 0, "max": 1, "step": 1})
                    }
                }

    RETURN_TYPES = ("LATENT","LATENT")
    RETURN_NAMES = ("LATENT A", "LATENT B")
    FUNCTION = "boolean"

    CATEGORY = "easyui"

    def boolean(self, latent, boolean):

        if int(round(boolean)) == 1:
             latent_a = latent
        else:
             latent_b = latent

        return (latent_a, latent_b)

class EasyUISampler:

    @classmethod
    def INPUT_TYPES(s):
                return {"required":
                    {"model": ("MODEL",),
                    "vae": ("VAE",),
                    "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
                    "steps": ("INT", {"default": 20, "min": 1, "max": 10000}),
                    "cfg": ("FLOAT", {"default": 8.0, "min": 0.0, "max": 100.0}),
                    "sampler_name": (comfy.samplers.KSampler.SAMPLERS, ),
                    "scheduler": (comfy.samplers.KSampler.SCHEDULERS, ),
                    "denoise": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01}),
                    "width": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 8}),
                    "height": ("INT", {"default": 512, "min": 64, "max": MAX_RESOLUTION, "step": 8}),
                    "batch_size": ("INT", {"default": 1, "min": 1, "max": 64}),
                    "positive": ("CONDITIONING",),
                    "negative": ("CONDITIONING",),
                    # "control_net": ("CONDITIONING",),
                     }
                }

    RETURN_TYPES = ("MODEL", "VAE", "LATENT", "CONDITIONING", "CONDITIONING", "STRING", "STRING", "INT")
    RETURN_NAMES = ("MODEL", "VAE", "LATENT", "POSITIVE CONDITIONING", "NEGATIVE CONDITIONING", "sampler_name", "scheduler", "seed")
    FUNCTION = "sample"


    CATEGORY = "easyui"

    def sample(self, model, vae, seed, steps, cfg, sampler_name, scheduler, denoise, width, height, batch_size, positive, negative):

        latent_image = empty_latent(width, height, batch_size)

        latent = common_ksampler(model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise,)

        return (model, vae, latent[0], positive, negative, sampler_name, scheduler, seed)

class HRFix:
    upscale_methods = ["nearest-exact", "bilinear", "area", "bicubic", "bislerp"]
    UPSCALE_MODELS = folder_paths.get_filename_list("upscale_models")
    UPSCALE_MODES = ["latent_upscale"] + UPSCALE_MODELS
    UPSCALE_MODELS.insert(0, "none")
    @classmethod
    def INPUT_TYPES(s):
                return {"required":
                    {"enable": ("BOOLEAN", {"default": True}),
                    "model": ("MODEL", ),
                    "vae": ("VAE", ),
                    "latent": ("LATENT",),
                    "upscaler": (s.UPSCALE_MODES,),
                    "upscale_method": (s.upscale_methods,),
                    "hires_steps": ("INT", {"default": 20, "min": 1, "max": 10000}),
                    "cfg": ("FLOAT", {"default": 8.0, "min": 0.0, "max": 100.0}),
                    "denoise": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01}),
                    "scale_factor": ("FLOAT", {"default": 2.0, "min": 0.010, "max": 8.0, "step": 0.010}),
                    "positive_conditioning": ("CONDITIONING",),
                    "negative_conditioning": ("CONDITIONING",),
                    "sampler_name": ("STRING", {"forceInput": True}),
                    "scheduler": ("STRING", {"forceInput": True}),
                    "seed": ("INT",{"forceInput": True}),
                     }
                }

    RETURN_TYPES = ("LATENT", "VAE")
    FUNCTION = "HRFix"


    CATEGORY = "easyui"

    def HRFix(self, enable, model, vae, latent, upscaler, upscale_method, hires_steps, cfg, 
              denoise, scale_factor, positive_conditioning, negative_conditioning, seed, sampler_name, scheduler):
        print(seed)
        if enable:
            if upscaler == "latent_upscale":
                upscaled_latent = latent_upscale_by(latent, upscale_method, scale_factor)
            else:
                image = vae.decode(latent["samples"])
            
                upscaled_image = upscale_image_using_model(upscaler, image)
                upscaled_imageby = upscale_image_by(upscaled_image, scale_factor, upscale_method)
                print(type(upscaled_imageby))
                upscaled_latent = vae_encode(vae, upscaled_imageby)


            latent = common_ksampler(model, seed, hires_steps, cfg, sampler_name, scheduler, positive_conditioning, negative_conditioning, upscaled_latent, denoise,)

            return (latent[0], vae,)
        else: 
            return (latent, vae,)

def vae_encode_crop_pixels(pixels):
    x = (pixels.shape[1] // 8) * 8
    y = (pixels.shape[2] // 8) * 8
    if pixels.shape[1] != x or pixels.shape[2] != y:
        x_offset = (pixels.shape[1] % 8) // 2
        y_offset = (pixels.shape[2] % 8) // 2
        pixels = pixels[:, x_offset:x + x_offset, y_offset:y + y_offset, :]
    return pixels

def vae_encode(vae, pixels):
    pixels = vae_encode_crop_pixels(pixels)
    t = vae.encode(pixels[:,:,:,:3])
    return {"samples":t}

def upscale_image_by(image, scale_by, upscale_method):
    samples = image.movedim(-1,1)
    width = round(samples.shape[3] * scale_by)
    height = round(samples.shape[2] * scale_by)
    s = comfy.utils.common_upscale(samples, width, height, upscale_method, "disabled")
    s = s.movedim(1,-1)
    return s

def upscale_image_using_model(model_name, image):
        model_path = folder_paths.get_full_path("upscale_models", model_name)
        sd = comfy.utils.load_torch_file(model_path, safe_load=True)
        upscale_model = model_loading.load_state_dict(sd).eval()
 
        device = model_management.get_torch_device()
        upscale_model.to(device)
        in_img = image.movedim(-1,-3).to(device)
        free_memory = model_management.get_free_memory(device)

        tile = 512
        overlap = 32

        oom = True
        while oom:
            try:
                steps = in_img.shape[0] * comfy.utils.get_tiled_scale_steps(in_img.shape[3], in_img.shape[2], tile_x=tile, tile_y=tile, overlap=overlap)
                pbar = comfy.utils.ProgressBar(steps)
                s = comfy.utils.tiled_scale(in_img, lambda a: upscale_model(a), tile_x=tile, tile_y=tile, overlap=overlap, upscale_amount=upscale_model.scale, pbar=pbar)
                oom = False
            except model_management.OOM_EXCEPTION as e:
                tile //= 2
                if tile < 128:
                    raise e

        upscale_model.cpu()
        s = torch.clamp(s.movedim(-3,-1), min=0, max=1.0)
        return s

def load_checkpoint(ckpt_name, output_vae=True, output_clip=True):
    ckpt_path = folder_paths.get_full_path("checkpoints", ckpt_name)
    out = comfy.sd.load_checkpoint_guess_config(ckpt_path, output_vae=True, output_clip=True, embedding_directory=folder_paths.get_folder_paths("embeddings"))
    return out

def latent_upscale_by(samples, upscale_method, scale_by):
    s = samples.copy()
    width = round(samples["samples"].shape[3] * scale_by)
    height = round(samples["samples"].shape[2] * scale_by)
    s["samples"] = comfy.utils.common_upscale(samples["samples"], width, height, upscale_method, "disabled")
    return s

def vae_decode(vae, samples):
    return vae.decode(samples["samples"])

def load_vae(vae_name):
    vae_path = folder_paths.get_full_path("vae", vae_name)
    vae = comfy.sd.VAE(ckpt_path=vae_path)
    return vae

def empty_latent(width, height, batch_size=1):
    latent = torch.zeros([batch_size, 4, height // 8, width // 8])
    return {"samples":latent}

def clip_text_encode(clip, text):
    tokens = clip.tokenize(text)
    cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
    return [[cond, {"pooled_output": pooled}]]


class EasyUI_ControlNet:
    @classmethod
    def INPUT_TYPES(s):
        input_dir = folder_paths.get_input_directory()
        files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
        return {"required": {"conditioning": ("CONDITIONING", ),
                             "control_net_model": (folder_paths.get_filename_list("controlnet"), ),
                 
                             "strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 10.0, "step": 0.01}),
                             "image": (sorted(files), )
                             }}
    RETURN_TYPES = ("CONDITIONING",)
    FUNCTION = "apply_controlnet"

    CATEGORY = "easyui"



    def apply_controlnet(self, conditioning, control_net_model, image, strength):
        controlnet_path = folder_paths.get_full_path("controlnet", control_net_model)
        controlnet = comfy.sd.load_controlnet(controlnet_path)
        image_path = folder_paths.get_annotated_filepath(image)
        i = Image.open(image_path)
        i = ImageOps.exif_transpose(i)
        image = i.convert("RGB")
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]
        if 'A' in i.getbands():
            mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
            mask = 1. - torch.from_numpy(mask)
        else:
            mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")

        if strength == 0:
            return (conditioning, )

        c = []
        control_hint = image.movedim(-1,1)
        for t in conditioning:
            n = [t[0], t[1].copy()]
            c_net = controlnet.copy().set_cond_hint(control_hint, strength)
            if 'control' in t[1]:
                c_net.set_previous_controlnet(t[1]['control'])
            n[1]['control'] = c_net
            n[1]['control_apply_to_uncond'] = True
            c.append(n)
        return (c, )


# A dictionary that contains all nodes you want to export with their names
# NOTE: names should be globally unique
NODE_CLASS_MAPPINGS = {
    "EasyUISampler": EasyUISampler,
    "HRFix": HRFix,
    "EasyUI.Prompt": EasyUI_Prompt,
    "LatentBoolean": LatentBoolean,
    "EasyUI_ControlNet": EasyUI_ControlNet,
    
}

# A dictionary that contains the friendly/humanly readable titles for the nodes
NODE_DISPLAY_NAME_MAPPINGS = {
    "EasyUISampler": "EasyUI Sampler",
    "HRFix": "HRFix",
    "EasyUI.Prompt": "EasyUI Prompt",
    "LatentBoolean": "Latent Boolean (OR)"
}

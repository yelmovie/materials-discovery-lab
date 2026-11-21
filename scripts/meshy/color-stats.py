# Blender: print the colour clusters of a Meshy GLB's base texture, sampled per face (area-weighted).
import bpy, sys, numpy as np, colorsys
src = sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
ob = [o for o in bpy.context.scene.objects if o.type=='MESH'][0]; me = ob.data
img = [n.image for n in ob.active_material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'base' in (n.label+n.name+n.image.name).lower()] or [n.image for n in ob.active_material.node_tree.nodes if n.type=='TEX_IMAGE']
img = img[0]; W,H = img.size; px = np.array(img.pixels[:], dtype=np.float32).reshape(H,W,4)
uv = me.uv_layers.active.data; n = len(me.polygons)
lu = np.zeros((len(me.loops),2),np.float32); uv.foreach_get('uv', lu.ravel())
start = np.zeros(n,np.int32); me.polygons.foreach_get('loop_start',start)
area = np.zeros(n,np.float32); me.polygons.foreach_get('area',area)
c = (lu[start]+lu[start+1]+lu[start+2])/3
x = np.clip((c[:,0]%1)*W,0,W-1).astype(int); y = np.clip((c[:,1]%1)*H,0,H-1).astype(int)
rgb = px[y,x,:3]
hsv = np.array([colorsys.rgb_to_hsv(*p) for p in rgb])
print('image', img.name, W, H, 'faces', n)
bins = {}
for (h,s,v),a in zip(hsv,area):
    key = (int(h*36)*10, round(s*4)/4, round(v*4)/4)
    bins[key] = bins.get(key,0)+a
tot = sum(bins.values())
for k,a in sorted(bins.items(), key=lambda kv:-kv[1])[:30]: print(k, round(100*a/tot,2))

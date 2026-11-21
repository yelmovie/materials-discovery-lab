# Split a single-mesh Meshy GLB into named part meshes by the colour of its base texture (plus position for the box).
# blender -b --factory-startup -P scripts/meshy/segment-parts.py -- <umbrella|box> <src.glb> <out.glb> [preview-prefix]
# Each part keeps the original UVs and textures; only the faces are regrouped, so the look does not change.
import bpy, bmesh, sys, math, colorsys, numpy as np, mathutils

kind, src, out = sys.argv[sys.argv.index('--') + 1:][:3]
preview = (sys.argv[sys.argv.index('--') + 1:] + [None])[3]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
bpy.context.view_layer.objects.active = ob
# Bake the importer's Y-up conversion into the vertices so positions below are plain Blender Z-up.
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = ob.data
mat = ob.active_material
img = [n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and any(l.to_socket.name == 'Base Color' for o in n.outputs for l in o.links)][0]
W, H = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)[:, :, :3]

n = len(me.polygons)
loops = len(me.loops)
lu = np.zeros((loops, 2), np.float32); me.uv_layers.active.data.foreach_get('uv', lu.ravel())
start = np.zeros(n, np.int32); me.polygons.foreach_get('loop_start', start)
cen = np.zeros((n, 3), np.float32); me.polygons.foreach_get('center', cen.ravel())
nor = np.zeros((n, 3), np.float32); me.polygons.foreach_get('normal', nor.ravel())

def sample(u):
    x = np.clip((u[:, 0] % 1) * W, 0, W - 1).astype(int); y = np.clip((u[:, 1] % 1) * H, 0, H - 1).astype(int)
    return px[y, x]
# Average the centre and the three corners so a face on a colour edge takes its dominant colour.
rgb = (sample((lu[start] + lu[start + 1] + lu[start + 2]) / 3) * 2 + sample(lu[start]) + sample(lu[start + 1]) + sample(lu[start + 2])) / 5
mx, mn = rgb.max(1), rgb.min(1)
v = mx; s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
d = np.maximum(mx - mn, 1e-6)
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
h = np.where(mx - mn < 1e-6, 0, h)

lo, hi = cen.min(0), cen.max(0); size = hi - lo
names = []
if kind == 'umbrella':
    names = ['canopy', 'frame', 'handle']
    label = np.full(n, 0)                                   # canopy: navy cloth
    label[(s < 0.28) & (v > 0.45)] = 1                      # frame: grey / white metal (ribs, shaft, tips, ferrule)
    label[((h < 55) | (h > 340)) & (s >= 0.28)] = 2         # handle: orange-brown wood
else:
    names = ['body', 'lid', 'window', 'handle', 'bumper']
    label = np.full(n, 0)                                   # body: turquoise shell
    pale = (h > 150) & (h < 215) & (s < 0.55) & (v > 0.62)  # glass tint and highlights
    star = (h >= 38) & (h < 70) & (v > 0.72) & (s > 0.35)   # yellow sample behind the glass
    cream = (s < 0.25) & (v > 0.7) & ~((h > 150) & (h < 215))
    coral = ((h > 335) | (h < 14)) & (s > 0.3) & (v > 0.6)
    leather = (h >= 8) & (h < 32) & (s > 0.45) & (v < 0.72)
    brass = (h >= 28) & (h < 60) & (s > 0.3) & ~star
    label[coral] = 4
    label[leather] = 3
    label[brass] = 3
    # The window sits on the face that carries most of the pale glass colour.
    glass = pale | star | cream
    front = np.zeros(3); k = int(np.argmax(np.abs(nor[glass].mean(0)))); front[k] = np.sign(nor[glass].mean(0)[k])
    facing = (nor @ front) > 0.55
    gx = cen[glass & facing]
    win_lo, win_hi = np.percentile(gx, 2, axis=0), np.percentile(gx, 98, axis=0)
    inside = np.all((cen >= win_lo - 0.01) & (cen <= win_hi + 0.01), axis=1)
    label[glass & inside & ((nor @ front) > 0.2)] = 2
    label[(label == 0) & inside & facing & (np.abs((cen - win_lo) @ front) < 0.02)] = 2
    # Lid: everything above the seam between lid and body (top quarter of the shell).
    seam = lo[2] + size[2] * float(__import__('os').environ.get('SEAM', '0.62'))
    label[(label == 0) & (cen[:, 2] > seam)] = 1
    # Brass on the front (the latch) belongs to the lid, not the carrying handle.
    latch = brass & ((nor @ front) > 0.3) & (cen[:, 2] < hi[2] - size[2] * 0.12)
    label[latch] = 1

# Clean speckles: a face that disagrees with most of its neighbours takes their label.
le = np.zeros(loops, np.int32); me.loops.foreach_get('edge_index', le)
tot = np.zeros(n, np.int32); me.polygons.foreach_get('loop_total', tot)
lf = np.repeat(np.arange(n), tot)
order = np.argsort(le, kind='stable'); se, sf = le[order], lf[order]
pair = se[:-1] == se[1:]
a, b2 = sf[:-1][pair], sf[1:][pair]
for it in range(6):
    votes = np.zeros((n, len(names)), np.int32)
    np.add.at(votes, (a, label[b2]), 1); np.add.at(votes, (b2, label[a]), 1)
    best = votes.argmax(1); strong = votes.max(1) >= 2
    changed = strong & (best != label) & (votes[np.arange(n), label] <= 1)
    label = np.where(changed, best, label)

for i, name in enumerate(names): print('PART', name, int((label == i).sum()))

# Split into one object per part, each with its own material slot (same textures) named after the part.
bm = bmesh.new(); bm.from_mesh(me)
objs = []
for i, name in enumerate(names):
    if not (label == i).any(): continue
    part = ob.copy(); part.data = me.copy(); part.name = part.data.name = name
    bpy.context.scene.collection.objects.link(part)
    pb = bmesh.new(); pb.from_mesh(part.data); pb.faces.ensure_lookup_table()
    bmesh.ops.delete(pb, geom=[f for f in pb.faces if label[f.index] != i], context='FACES')
    pb.to_mesh(part.data); pb.free()
    m2 = mat.copy(); m2.name = name; part.data.materials.clear(); part.data.materials.append(m2)
    objs.append(part)
bm.free()
bpy.data.objects.remove(ob)
# Centre the whole set on the origin with the bottom at y=0 (glTF), so the app can frame it without guessing.
allv = np.vstack([np.array([p.matrix_world @ v.co for v in p.data.vertices]) for p in objs])
lo, hi = allv.min(0), allv.max(0)
shift = mathutils.Vector((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))
for p in objs: p.data.transform(mathutils.Matrix.Translation(shift))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_apply=True)
print('EXPORTED', out)

if preview:
    flat = {'canopy': (0.15, 0.3, 0.9), 'frame': (0.95, 0.95, 0.95), 'handle': (0.95, 0.45, 0.05), 'body': (0.1, 0.6, 0.6), 'lid': (0.6, 0.3, 0.9), 'window': (0.7, 0.95, 1), 'bumper': (1, 0.3, 0.3)}
    for p in objs:
        fm = bpy.data.materials.new('f' + p.name); fm.diffuse_color = (*flat[p.name], 1); fm.use_nodes = True
        fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*flat[p.name], 1)
        p.data.materials.clear(); p.data.materials.append(fm)
    scene = bpy.context.scene; scene.render.engine = 'BLENDER_EEVEE'; scene.render.resolution_x = scene.render.resolution_y = 520
    world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (0.8, 0.2, 0.6); scene.collection.objects.link(sun)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
    c = mathutils.Vector((0, 0, (hi[2] - lo[2]) / 2))
    for i, (az, el) in enumerate([(-60, 20), (120, 20), (-60, -45), (30, 70)]):
        R = 4.4; A = math.radians(az); E = math.radians(el)
        cam.location = c + mathutils.Vector((R * math.cos(E) * math.cos(A), R * math.cos(E) * math.sin(A), R * math.sin(E)))
        cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = f'{preview}-{i}.png'; bpy.ops.render.render(write_still=True)

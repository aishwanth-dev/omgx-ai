"""Build the OMGX "Neural Engine Core" hero object and the journey ring.

Run only through the headless runner:
    powershell -NoProfile -File scripts/blender/run-blender.ps1
    powershell -NoProfile -File scripts/blender/run-blender.ps1 -ScriptArgs --only,hero
Arguments after "--": --site <website root> [--only all|hero|ring] [--no-render]

Outputs (relative to the site root):
    public/models/hero-core.glb, public/models/hero-core-lite.glb, public/models/journey-ring.glb
    public/images/hero-core-poster.webp, public/images/journey-ring-poster.webp
    art/hero-core/previews/*.png, art/hero-core/build-report.json

The object is an original armillary / gimbal assembly: a grooved graphite core, three nested
bevelled rings that pivot at the core, a twisted striped ribbon, red bead nodes and blue inlay traces.
Every element lives in its own spherical shell, so any ring rotation about the core never intersects
another element. The script is deterministic (no randomness, no timestamps in outputs).
"""
import json
import math
import os
import struct
import sys

import bmesh
import bpy
from mathutils import Vector

# ----------------------------------------------------------------------------------------------
# PARAMETERS (all lengths in Blender units; the hero spans about 4.6 units)
# ----------------------------------------------------------------------------------------------
P = {
    # Core: glossy graphite sphere, equatorial groove, flat polar bosses (an engineered bearing look).
    "core_radius": 0.90,
    "core_groove_half": 0.05,      # half-height of the equatorial groove
    "core_groove_depth": 0.07,
    "core_boss_lat": 74.0,         # latitude (deg) where the polar boss begins
    "core_boss_height": 0.035,
    "core_lat_steps": 36,          # profile samples per hemisphere arc
    "core_segments": 128,
    # Rings: (name, band centre radius, radial thickness, axial width, rest rotation X/Z in degrees).
    # Rest rotation is X then Z (world), chosen so the front view shows three distinct ellipses:
    # outer almost face-on, mid on one diagonal, inner on the other.
    "rings": [
        ("Ring_Inner", 1.28, 0.070, 0.160, (35.0, -60.0)),
        ("Ring_Mid", 1.58, 0.060, 0.130, (60.0, 58.0)),
        ("Ring_Outer", 1.88, 0.055, 0.110, (80.0, 15.0)),
    ],
    "ring_segments": 192,
    "ring_corner_frac": 0.38,      # corner radius as a fraction of the smaller half-size
    "bevel_steps": 3,
    "support_offset": 0.003,       # support points beside each bevel keep the flats flat-shaded
    # Inlay traces on each ring's outer face (U runs 0 -> 1 along the loop).
    "trace_width_frac": 0.16,
    "trace_proud": 0.0025,
    "trace_inset": 0.002,
    # Ribbon: wider band outside the outer ring, gentle sinusoidal twist, alternating stripes.
    "ribbon_radius": 2.22,
    "ribbon_width": 0.24,          # iter 2: 0.30 -> 0.24, the wide band dominated the silhouette
    "ribbon_thickness": 0.022,
    "ribbon_twist_amp": 0.35,      # radians
    "ribbon_twist_k": 2,           # twist waves per revolution
    "ribbon_stripe_period": 8,     # iter 2: faces per stripe period (was 6 on / 6 off, read as a chequered flag)
    "ribbon_stripe_on": 2,         # iter 2: enamel faces per period, so the stripes read as instrument ticks
    "ribbon_segments": 240,
    "ribbon_rest": (-28.0, -20.0),
    # Bead nodes: (ring index, angle deg) at irregular intervals; elongated along the ring tangent.
    "bead_radius": 0.040,
    "bead_elongation": 1.5,
    "bead_layout": [
        (0, 18.0), (0, 131.0), (0, 247.0),
        (1, 52.0), (1, 109.0), (1, 203.0), (1, 318.0),
        (2, 8.0), (2, 77.0), (2, 161.0), (2, 236.0), (2, 292.0),
    ],
    "bead_segments": 20,
    "bead_rings": 10,
    # Struts (engineering pathways) from the core to the inner ring, in the inner ring's plane.
    "strut_radius": 0.022,
    "strut_foot_radius": 0.042,
    "strut_angles": [45.0, 135.0, 225.0, 315.0],
    "strut_segments": 12,
    # Lite variant: about half the segments and fewer beads.
    "lite_factor": 0.5,
    "lite_bead_count": 8,
    # Journey ring: tilted bevelled band, alternating stripe materials.
    "jr_radius": 1.0,
    "jr_thickness": 0.09,
    "jr_width": 0.26,
    "jr_segments": 160,
    "jr_stripe_period": 6,         # iter 2: was 4 on / 4 off (candy-cane look)
    "jr_stripe_on": 2,
    "jr_rest": (62.0, -12.0),
    # Materials.
    "graphite_srgb": "#1a1f2e",
    "graphite_metallic": 0.55,
    "graphite_roughness": 0.30,
    "graphite_coat": 1.0,
    "graphite_coat_roughness": 0.06,
    "enamel_srgb": "#eceff7",
    "enamel_roughness": 0.38,
    "matcha_srgb": "#4f7cff",   # blue inlay traces (the old matcha slot)
    "bead_srgb": "#ff4a5e",     # red bead nodes
    "bead_emission_strength": 1.6,
    "matcha_emission_strength": 1.6,   # iter 2: 2.0 -> 1.6 for a more restrained glow; >1 so the exporter writes KHR_materials_emissive_strength
    "sharp_angle_deg": 40.0,
    # Export (Draco).
    "draco_level": 7,
    "draco_position_bits": 14,
    "draco_normal_bits": 10,
    "draco_texcoord_bits": 12,
    # Render.
    "preview_px": 1024,
    "review_px": 600,
    "poster_px": 1600,
    "jr_poster_px": 1200,
    "samples": 48,
    "lens_mm": 50.0,
    "camera_distance": 8.2,
    "jr_camera_distance": 4.0,     # iter 2: 4.6 -> 4.0, ring filled only ~60% of the frame
    "world_rgb": (0.003, 0.0038, 0.0085),
    "key": {"loc": (-4.5, -5.5, 5.0), "size": 3.0, "energy": 650.0, "color": (0.92, 0.95, 1.0)},
    "fill": {"loc": (5.5, -4.0, -1.5), "size": 4.0, "energy": 200.0, "color": (0.42, 0.58, 1.0)},
    "rim": {"loc": (2.5, 6.5, 3.5), "size": 3.0, "energy": 520.0, "color": (1.0, 0.26, 0.34)},
}

NODE_FILE = "src/components/three/heroCoreNodes.json"


# ----------------------------------------------------------------------------------------------
# Arguments and paths
# ----------------------------------------------------------------------------------------------
def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = {"site": None, "only": "all", "render": True}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--site":
            args["site"] = argv[i + 1]
            i += 2
        elif a == "--only":
            args["only"] = argv[i + 1]
            i += 2
        elif a == "--no-render":
            args["render"] = False
            i += 1
        else:
            raise SystemExit("unknown argument: " + a)
    assert args["site"] and os.path.isdir(args["site"]), "--site must be the website root"
    assert args["only"] in ("all", "hero", "ring"), "--only must be all, hero or ring"
    return args


ARGS = parse_args()
SITE = os.path.abspath(ARGS["site"])
assert SITE[0].upper() == "A", "outputs must stay on drive A:"


def site_path(rel):
    p = os.path.join(SITE, *rel.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


with open(site_path(NODE_FILE), "r", encoding="utf-8") as fh:
    NODES = json.load(fh)
ALL_NODE_NAMES = [NODES["core"], *NODES["rings"], NODES["ribbon"], *NODES["nodes"], *NODES["traces"], *NODES["paths"]]
assert len(NODES["rings"]) == len(P["rings"]) == len(NODES["traces"])
assert len(NODES["nodes"]) == len(P["bead_layout"])
assert len(NODES["paths"]) == len(P["strut_angles"])


# ----------------------------------------------------------------------------------------------
# Geometry helpers
# ----------------------------------------------------------------------------------------------
def srgb_to_linear(hex_str):
    h = hex_str.lstrip("#")
    out = []
    for k in range(3):
        c = int(h[2 * k:2 * k + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


def revolve(profile, segs, to_xyz, closed_profile=False, poles=False, seam=False, uv=False):
    """Sweep a 2D profile [(r, h)] around an axis. to_xyz(r, h, phi) -> (x, y, z).
    poles=True merges r == 0 points into one vertex; seam=True duplicates the seam column for UVs."""
    n = len(profile)
    cols = segs + 1 if seam else segs
    verts, grid, pole_idx = [], [], {}
    for j in range(cols):
        phi = 2.0 * math.pi * j / segs
        row = []
        for i, (r, h) in enumerate(profile):
            if poles and abs(r) < 1e-9:
                if i not in pole_idx:
                    pole_idx[i] = len(verts)
                    verts.append(to_xyz(0.0, h, 0.0))
                row.append(pole_idx[i])
            else:
                row.append(len(verts))
                verts.append(to_xyz(r, h, phi))
        grid.append(row)
    faces, cols_of_face, uvs = [], [], []
    span = n if closed_profile else n - 1
    for j in range(segs):
        j2 = j + 1 if seam else (j + 1) % segs
        for i in range(span):
            i2 = (i + 1) % n
            quad = [(j, i), (j2, i), (j2, i2), (j, i2)]
            face, corner_uv = [], []
            for (cj, ci), vi in zip(quad, [grid[a][b] for a, b in quad]):
                if vi in face:
                    continue
                face.append(vi)
                vv = (ci if (cj, ci) != (j, i2) and (cj, ci) != (j2, i2) else i + 1) / float(span)
                corner_uv.append((cj / float(segs), vv))
            if len(face) < 3:
                continue
            faces.append(face)
            cols_of_face.append(j)
            uvs.append(corner_uv)
    return verts, faces, cols_of_face, (uvs if uv else None)


def rounded_rect(a, b, c, steps, support):
    """Closed CCW profile of a rectangle with half-sizes a (radial) and b (axial), corner radius c."""
    pts = []
    corners = [((a - c, b - c), 0.0), ((-(a - c), b - c), 90.0), ((-(a - c), -(b - c)), 180.0), ((a - c, -(b - c)), 270.0)]
    for (cx, cy), start in corners:
        a0, a1 = math.radians(start), math.radians(start + 90.0)
        arc = [(cx + c * math.cos(a0 + (a1 - a0) * k / steps), cy + c * math.sin(a0 + (a1 - a0) * k / steps)) for k in range(steps + 1)]
        t0 = (-math.sin(a0), math.cos(a0))
        t1 = (-math.sin(a1), math.cos(a1))
        pts.append((arc[0][0] - support * t0[0], arc[0][1] - support * t0[1]))
        pts.extend(arc)
        pts.append((arc[-1][0] + support * t1[0], arc[-1][1] + support * t1[1]))
    return pts


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def make_mesh_obj(name, verts, faces, materials, face_mat=None, uvs=None, parent=None, location=(0.0, 0.0, 0.0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    for m in materials:
        me.materials.append(m)
    if face_mat is not None:
        me.polygons.foreach_set("material_index", face_mat)
    if uvs is not None:
        layer = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for k, li in enumerate(poly.loop_indices):
                layer.data[li].uv = uvs[poly.index][k]
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    if hasattr(me, "shade_smooth"):
        me.shade_smooth()
    else:
        for p in me.polygons:
            p.use_smooth = True
    assert hasattr(me, "set_sharp_from_angle"), "Mesh.set_sharp_from_angle is required"
    me.set_sharp_from_angle(angle=math.radians(P["sharp_angle_deg"]))
    me.update()
    obj = bpy.data.objects.new(name, me)
    link(obj)
    if parent is not None:
        obj.parent = parent  # matrix_parent_inverse stays identity: location is in parent space
    obj.location = location
    return obj


def ring_rotation(rest_deg):
    ax, az = rest_deg
    return (math.radians(ax), 0.0, math.radians(az))


# ----------------------------------------------------------------------------------------------
# Materials
# ----------------------------------------------------------------------------------------------
def principled(name, base, metallic, roughness, coat=0.0, coat_roughness=0.03, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    if m.node_tree is None:
        m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for key in ("Base Color", "Metallic", "Roughness", "Coat Weight", "Coat Roughness", "Emission Color", "Emission Strength"):
        assert key in bsdf.inputs, "Principled BSDF input missing: " + key
    bsdf.inputs["Base Color"].default_value = (*base, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    else:
        bsdf.inputs["Emission Strength"].default_value = 0.0
    return m


def make_materials():
    matcha = srgb_to_linear(P["matcha_srgb"])
    bead = srgb_to_linear(P["bead_srgb"])
    return {
        "graphite": principled("Graphite", srgb_to_linear(P["graphite_srgb"]), P["graphite_metallic"], P["graphite_roughness"],
                               coat=P["graphite_coat"], coat_roughness=P["graphite_coat_roughness"]),
        "enamel": principled("Enamel", srgb_to_linear(P["enamel_srgb"]), 0.0, P["enamel_roughness"]),
        "matcha": principled("Trace_Blue_Emissive", tuple(c * 0.25 for c in matcha), 0.0, 0.35,
                             emission=matcha, emission_strength=P["matcha_emission_strength"]),
        "bead": principled("Bead_Red_Emissive", tuple(c * 0.25 for c in bead), 0.0, 0.35,
                           emission=bead, emission_strength=P["bead_emission_strength"]),
    }


# ----------------------------------------------------------------------------------------------
# Hero object
# ----------------------------------------------------------------------------------------------
def core_profile(steps):
    rc, gh, gd = P["core_radius"], P["core_groove_half"], P["core_groove_depth"]
    lat_b = math.radians(P["core_boss_lat"])
    lat_g = math.asin(gh / rc)
    rb = rc * math.cos(lat_b)
    zb = rc * math.sin(lat_b)
    zt = zb + P["core_boss_height"]
    arc = [(rc * math.cos(lat_g + (lat_b - lat_g) * k / steps), rc * math.sin(lat_g + (lat_b - lat_g) * k / steps)) for k in range(steps + 1)]
    top = [(r, z) for r, z in arc] + [(rb * 0.97, zt - 0.006), (rb * 0.93, zt), (0.0, zt)]
    groove = [(rc * math.cos(lat_g), -gh), (rc - gd, -gh * 0.75), (rc - gd, gh * 0.75)]
    bottom = [(r, -z) for r, z in reversed(top)]
    # bottom pole -> bottom arc ends at (r_g, -gh); groove; top arc starts at (r_g, gh)
    return bottom[:-1] + groove + top


def build_hero(mats, lite=False):
    f = P["lite_factor"] if lite else 1.0
    seg = lambda n: max(8, int(round(n * f)))
    objs = {}

    # Core
    prof = core_profile(seg(P["core_lat_steps"]))
    v, fc, _, _ = revolve(prof, seg(P["core_segments"]), lambda r, h, p: (r * math.cos(p), r * math.sin(p), h), poles=True)
    objs[NODES["core"]] = make_mesh_obj(NODES["core"], v, fc, [mats["graphite"]])

    # Rings, traces
    rings = []
    for idx, (name, R, t, w, rest) in enumerate(P["rings"]):
        a, b = t / 2.0, w / 2.0
        c = min(a, b) * P["ring_corner_frac"]
        prof = rounded_rect(a, b, c, P["bevel_steps"], P["support_offset"])
        to_xyz = lambda r, h, p, R=R: ((R + r) * math.cos(p), (R + r) * math.sin(p), h)
        v, fc, _, _ = revolve(prof, seg(P["ring_segments"]), to_xyz, closed_profile=True)
        ring = make_mesh_obj(name, v, fc, [mats["graphite"]])
        ring.rotation_mode = "XYZ"
        ring.rotation_euler = ring_rotation(rest)
        rings.append(ring)
        objs[name] = ring

        tw = w * P["trace_width_frac"] / 2.0
        r_in, r_out = a - P["trace_inset"], a + P["trace_proud"]
        tprof = [(r_in, -tw), (r_out, -tw), (r_out, tw), (r_in, tw)]
        v, fc, _, uvs = revolve(tprof, seg(P["ring_segments"]), to_xyz, closed_profile=True, seam=True, uv=True)
        tname = NODES["traces"][idx]
        objs[tname] = make_mesh_obj(tname, v, fc, [mats["matcha"]], uvs=uvs, parent=ring)

    # Beads parented to the rings
    beads = P["bead_layout"][:P["lite_bead_count"]] if lite else P["bead_layout"]
    rb = P["bead_radius"]
    bprof = [(rb * math.cos(math.radians(-90 + 180.0 * k / seg(P["bead_rings"]))), rb * math.sin(math.radians(-90 + 180.0 * k / seg(P["bead_rings"]))))
             for k in range(seg(P["bead_rings"]) + 1)]
    bprof[0] = (0.0, bprof[0][1])
    bprof[-1] = (0.0, bprof[-1][1])
    for k, (ri, ang) in enumerate(beads):
        _, R, t, _, _ = P["rings"][ri]
        th = math.radians(ang)
        n_ = Vector((math.cos(th), math.sin(th), 0.0))
        t_ = Vector((-math.sin(th), math.cos(th), 0.0))
        z_ = Vector((0.0, 0.0, 1.0))
        to_xyz = lambda r, h, p, n_=n_, t_=t_, z_=z_: tuple(t_ * (h * P["bead_elongation"]) + (n_ * math.cos(p) + z_ * math.sin(p)) * r)
        v, fc, _, _ = revolve(bprof, seg(P["bead_segments"]), to_xyz, poles=True)
        name = NODES["nodes"][k]
        loc = n_ * (R + t / 2.0)
        objs[name] = make_mesh_obj(name, v, fc, [mats["bead"]], parent=rings[ri], location=tuple(loc))

    # Struts from the core to the inner ring, parented to the inner ring
    _, R0, t0, _, _ = P["rings"][0]
    s0 = P["core_radius"] - 0.02
    s1 = R0 - t0 / 2.0 + 0.01
    sr, sf = P["strut_radius"], P["strut_foot_radius"]
    sprof = [(0.0, s0), (sf, s0), (sf, s0 + 0.035), (sr, s0 + 0.08), (sr, s1 - 0.06), (sf * 0.85, s1 - 0.02), (sf * 0.85, s1), (0.0, s1)]
    for k, ang in enumerate(P["strut_angles"]):
        th = math.radians(ang)
        d = Vector((math.cos(th), math.sin(th), 0.0))
        u = Vector((-math.sin(th), math.cos(th), 0.0))
        z_ = Vector((0.0, 0.0, 1.0))
        to_xyz = lambda r, h, p, d=d, u=u, z_=z_: tuple(d * h + (u * math.cos(p) + z_ * math.sin(p)) * r)
        v, fc, _, _ = revolve(sprof, seg(P["strut_segments"]), to_xyz, poles=True)
        name = NODES["paths"][k]
        objs[name] = make_mesh_obj(name, v, fc, [mats["graphite"]], parent=rings[0])

    # Ribbon: twisted band, stripes from alternating material faces
    Rr, hw, ht = P["ribbon_radius"], P["ribbon_width"] / 2.0, P["ribbon_thickness"] / 2.0
    rprof = [(ht, -hw + ht), (ht, hw - ht), (0.0, hw), (-ht, hw - ht), (-ht, -hw + ht), (0.0, -hw)]
    rsegs = seg(P["ribbon_segments"])
    period = max(4, int(round(P["ribbon_stripe_period"] * f)))
    on = max(1, int(round(P["ribbon_stripe_on"] * f)))
    rsegs -= rsegs % period  # a whole number of stripe periods so the pattern closes cleanly

    def ribbon_xyz(a, b, p):
        phi = P["ribbon_twist_amp"] * math.sin(P["ribbon_twist_k"] * p)
        er = Vector((math.cos(p), math.sin(p), 0.0))
        ez = Vector((0.0, 0.0, 1.0))
        c = er * Rr
        return tuple(c + er * (a * math.cos(phi) - b * math.sin(phi)) + ez * (a * math.sin(phi) + b * math.cos(phi)))

    v, fc, col, _ = revolve(rprof, rsegs, ribbon_xyz, closed_profile=True)
    fm = [1 if (j % period) < on else 0 for j in col]
    ribbon = make_mesh_obj(NODES["ribbon"], v, fc, [mats["graphite"], mats["enamel"]], face_mat=fm)
    ribbon.rotation_mode = "XYZ"
    ribbon.rotation_euler = ring_rotation(P["ribbon_rest"])
    objs[NODES["ribbon"]] = ribbon
    return objs


def build_journey_ring(mats):
    a, b = P["jr_thickness"] / 2.0, P["jr_width"] / 2.0
    c = min(a, b) * P["ring_corner_frac"]
    prof = rounded_rect(a, b, c, P["bevel_steps"], P["support_offset"])
    R = P["jr_radius"]
    segs = P["jr_segments"] - P["jr_segments"] % P["jr_stripe_period"]
    v, fc, col, _ = revolve(prof, segs, lambda r, h, p: ((R + r) * math.cos(p), (R + r) * math.sin(p), h), closed_profile=True)
    fm = [1 if (j % P["jr_stripe_period"]) < P["jr_stripe_on"] else 0 for j in col]
    ring = make_mesh_obj("Journey_Ring", v, fc, [mats["graphite"], mats["enamel"]], face_mat=fm)
    ring.rotation_mode = "XYZ"
    ring.rotation_euler = ring_rotation(P["jr_rest"])
    return {"Journey_Ring": ring}


# ----------------------------------------------------------------------------------------------
# Scene, export, render
# ----------------------------------------------------------------------------------------------
def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for d in list(coll):
            coll.remove(d)


def triangles(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs.values() if o.type == "MESH")


EXPORT_OPTS = {
    "export_format": "GLB",
    "use_selection": True,
    "export_apply": True,
    "export_yup": True,
    "export_cameras": False,
    "export_lights": False,
    "export_animations": False,
    "export_materials": "EXPORT",
    "export_draco_mesh_compression_enable": True,
    "export_draco_mesh_compression_level": P["draco_level"],
    "export_draco_position_quantization": P["draco_position_bits"],
    "export_draco_normal_quantization": P["draco_normal_bits"],
    "export_draco_texcoord_quantization": P["draco_texcoord_bits"],
}


def export_glb(objs, rel):
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    for key in EXPORT_OPTS:
        assert key in props, "glTF exporter option missing: " + key
    for o in bpy.context.scene.objects:
        o.select_set(o.name in objs)
    path = site_path(rel)
    res = bpy.ops.export_scene.gltf(filepath=path, **EXPORT_OPTS)
    assert "FINISHED" in res, "glTF export failed: " + rel
    return path


def read_glb_json(path):
    with open(path, "rb") as fh:
        data = fh.read()
    magic, _, _ = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF", "not a GLB: " + path
    clen, ctype = struct.unpack_from("<II", data, 12)
    assert ctype == 0x4E4F534A, "first GLB chunk is not JSON"
    return json.loads(data[20:20 + clen].decode("utf-8")), len(data)


def glb_summary(path, objs, expected_nodes):
    doc, size = read_glb_json(path)
    names = [n.get("name") for n in doc.get("nodes", [])]
    missing = [n for n in expected_nodes if n not in names]
    assert not missing, "%s is missing nodes: %s" % (path, missing)
    used, req = doc.get("extensionsUsed", []), doc.get("extensionsRequired", [])
    assert "KHR_draco_mesh_compression" in used and "KHR_draco_mesh_compression" in req, "Draco missing in " + path
    assert not any("uri" in b for b in doc.get("buffers", [])), "external buffer in " + path
    assert not doc.get("cameras") and "KHR_lights_punctual" not in used, "camera or light exported in " + path
    return {
        "file": os.path.relpath(path, SITE).replace("\\", "/"),
        "bytes": size,
        "kb": round(size / 1024.0, 1),
        "triangles": triangles(objs),
        "nodes": names,
        "extensionsUsed": used,
        "extensionsRequired": req,
    }


def eevee_engine():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    for ident in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        if ident in items:
            return ident
    raise RuntimeError("no EEVEE engine in " + str(items))


def look_at(obj, target=(0.0, 0.0, 0.0)):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def setup_render(px, transparent):
    sc = bpy.context.scene
    sc.render.engine = ENGINE
    sc.render.resolution_x = px
    sc.render.resolution_y = px
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = transparent
    if hasattr(sc, "eevee"):
        if hasattr(sc.eevee, "taa_render_samples"):
            sc.eevee.taa_render_samples = P["samples"]
        if hasattr(sc.eevee, "use_raytracing"):
            sc.eevee.use_raytracing = True
    try:
        sc.view_settings.view_transform = "AgX"
    except TypeError:
        pass
    if sc.world is None:
        sc.world = bpy.data.worlds.new("World")
    w = sc.world
    if w.node_tree is None:
        w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (*P["world_rgb"], 1.0)
    bg.inputs["Strength"].default_value = 1.0


def add_lights(scale=1.0):
    for key in ("key", "fill", "rim"):
        L = P[key]
        ld = bpy.data.lights.new("Light_" + key, type="AREA")
        ld.shape = "DISK"
        ld.size = L["size"] * scale
        ld.energy = L["energy"] * scale * scale
        ld.color = L["color"]
        lo = link(bpy.data.objects.new("Light_" + key, ld))
        lo.location = tuple(c * scale for c in L["loc"])
        look_at(lo)


def add_camera(direction, distance):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = P["lens_mm"]
    cam = link(bpy.data.objects.new("Cam", cd))
    d = Vector(direction).normalized() * distance
    cam.location = d
    look_at(cam)
    bpy.context.scene.camera = cam
    return cam


def render_to(path, fmt):
    sc = bpy.context.scene
    ims = sc.render.image_settings
    if hasattr(ims, "media_type"):
        ims.media_type = "IMAGE"
    ims.file_format = fmt
    ims.color_mode = "RGBA" if sc.render.film_transparent else "RGB"
    if fmt == "WEBP":
        ims.quality = 90
    sc.render.filepath = path
    res = bpy.ops.render.render(write_still=True)
    assert "FINISHED" in res and os.path.isfile(path), "render failed: " + path
    return path


def review_copy(src, dst, px):
    img = bpy.data.images.load(src)
    img.scale(px, px)
    img.filepath_raw = dst
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


VIEWS = {"front": (0.0, -1.0, 0.0), "three-quarter": (-0.7, -0.7, 0.38), "side": (1.0, 0.0, 0.0)}


def render_hero_set():
    out = []
    add_lights()
    prev_dir = site_path("art/hero-core/previews/x").rsplit(os.sep, 1)[0]
    for view, direction in VIEWS.items():
        cam = add_camera(direction, P["camera_distance"])
        setup_render(P["preview_px"], transparent=False)
        p = render_to(os.path.join(prev_dir, "hero-core-%s.png" % view), "PNG")
        review_copy(p, os.path.join(prev_dir, "hero-core-%s-600.png" % view), P["review_px"])
        out.append(os.path.relpath(p, SITE).replace("\\", "/"))
        bpy.data.objects.remove(cam, do_unlink=True)
    cam = add_camera(VIEWS["front"], P["camera_distance"])
    setup_render(P["poster_px"], transparent=True)
    poster = render_to(site_path("public/images/hero-core-poster.webp"), "WEBP")
    out.append(os.path.relpath(poster, SITE).replace("\\", "/"))
    return out


def render_ring_set():
    out = []
    add_lights(scale=0.6)
    prev_dir = site_path("art/hero-core/previews/x").rsplit(os.sep, 1)[0]
    add_camera(VIEWS["front"], P["jr_camera_distance"])
    setup_render(P["preview_px"], transparent=False)
    p = render_to(os.path.join(prev_dir, "journey-ring-front.png"), "PNG")
    out.append(os.path.relpath(p, SITE).replace("\\", "/"))
    setup_render(P["jr_poster_px"], transparent=True)
    poster = render_to(site_path("public/images/journey-ring-poster.webp"), "WEBP")
    out.append(os.path.relpath(poster, SITE).replace("\\", "/"))
    return out


# ----------------------------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------------------------
ENGINE = eevee_engine()
REPORT_PATH = site_path("art/hero-core/build-report.json")


def main():
    report = {}
    if os.path.isfile(REPORT_PATH):
        with open(REPORT_PATH, "r", encoding="utf-8") as fh:
            report = json.load(fh)
    report.update({"blender": bpy.app.version_string, "engine": ENGINE, "nodeFile": NODE_FILE, "nodeList": ALL_NODE_NAMES})
    report.setdefault("models", {})
    report.setdefault("renders", {})

    if ARGS["only"] in ("all", "hero"):
        clear_scene()
        mats = make_materials()
        objs = build_hero(mats)
        path = export_glb(objs, "public/models/hero-core.glb")
        s = glb_summary(path, objs, ALL_NODE_NAMES)
        for ext in ("KHR_materials_clearcoat", "KHR_materials_emissive_strength"):
            assert ext in s["extensionsUsed"], "hero GLB lacks " + ext
        assert s["bytes"] <= 1024 * 1024, "hero-core.glb over the 1 MB hard cap"
        report["models"]["hero"] = s
        if ARGS["render"]:
            report["renders"]["hero"] = render_hero_set()

        clear_scene()
        mats = make_materials()
        objs = build_hero(mats, lite=True)
        lite_nodes = [n for n in ALL_NODE_NAMES if n not in NODES["nodes"][P["lite_bead_count"]:]]
        path = export_glb(objs, "public/models/hero-core-lite.glb")
        s = glb_summary(path, objs, lite_nodes)
        s["omittedNodes"] = NODES["nodes"][P["lite_bead_count"]:]
        report["models"]["heroLite"] = s

    if ARGS["only"] in ("all", "ring"):
        clear_scene()
        mats = make_materials()
        objs = build_journey_ring(mats)
        path = export_glb(objs, "public/models/journey-ring.glb")
        s = glb_summary(path, objs, ["Journey_Ring"])
        assert s["bytes"] <= 300 * 1024, "journey-ring.glb over 300 KB"
        report["models"]["journeyRing"] = s
        if ARGS["render"]:
            report["renders"]["journeyRing"] = render_ring_set()

    report["params"] = P
    with open(REPORT_PATH, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(report, fh, indent=2)
        fh.write("\n")
    for k, m in report["models"].items():
        print("[build] %-12s %8.1f KB %7d tris  %s" % (k, m["kb"], m["triangles"], m["file"]))


main()

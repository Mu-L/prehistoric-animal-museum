"""Author the review avatar's grounded jump clip in Blender.

The application owns the character's world-space jump parabola. This script
authors a package-local anticipation, take-off, airborne, landing, and recovery
sequence. Joint rotations create the pose while a vertical-only Hips channel
lowers the centre of mass during the two-footed crouches. It never translates
the character horizontally, so the scale-comparison rail remains owned by the
runtime. The exported GLB is an animation source: the companion installer
copies only ``Jump_Land`` skeletal channels into the untouched V4 review
package so Blender never recompresses the reviewed mesh or textures.

Usage (arguments after ``--`` are passed to this script):

    blender --background --python scripts/author-scale-encounter-avatar-jump.py \
      -- --input=/absolute/avatar.glb --output=/tmp/avatar-jump-source.glb
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


CLIP_NAME = "Jump_Land"
FPS = 60
FRAME_END = 54


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--preview-dir", type=Path)
    separator = sys.argv.index("--") if "--" in sys.argv else len(sys.argv)
    return parser.parse_args(sys.argv[separator + 1 :])


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.actions,
        bpy.data.armatures,
        bpy.data.cameras,
        bpy.data.curves,
        bpy.data.lights,
        bpy.data.meshes,
        bpy.data.materials,
    ):
        for datablock in list(datablocks):
            datablocks.remove(datablock)


def imported_armature() -> bpy.types.Object:
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    rig = armatures[0]
    expected = {
        "Hips",
        "LeftUpLeg",
        "LeftLeg",
        "RightUpLeg",
        "RightLeg",
        "Spine",
        "LeftArm",
        "RightArm",
    }
    missing = sorted(expected.difference(rig.pose.bones.keys()))
    if missing:
        raise RuntimeError(f"Avatar rig is missing jump bones: {', '.join(missing)}")
    return rig


def clear_imported_animation(rig: bpy.types.Object) -> None:
    if rig.animation_data:
        rig.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)


def reset_pose(rig: bpy.types.Object) -> None:
    for bone in rig.pose.bones:
        bone.matrix_basis.identity()
        bone.rotation_mode = "QUATERNION"


def rotate_bone_in_armature_space(
    rig: bpy.types.Object,
    bone_name: str,
    axis: tuple[float, float, float],
    degrees: float,
) -> None:
    """Rotate around a visible character axis instead of a Meshy bone axis.

    The four Meshy packages share joint names but not consistent local bone
    rolls. Euler-X therefore bent one knee forward and the other sideways in
    the first jump candidate. Applying the delta in armature space makes both
    hip and knee hinges use the character's left/right axis consistently.
    """

    if abs(degrees) <= 1e-9:
        return
    bone = rig.pose.bones[bone_name]
    pivot = bone.head.copy()
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(degrees), 4, Vector(axis).normalized())
        @ Matrix.Translation(-pivot)
    )
    bone.matrix = transform @ bone.matrix
    bpy.context.view_layer.update()


def aim_bone_in_armature_space(
    rig: bpy.types.Object,
    bone_name: str,
    child_name: str,
    target_direction: tuple[float, float, float],
) -> None:
    """Aim a limb segment at a symmetric character-space direction."""

    bone = rig.pose.bones[bone_name]
    child = rig.pose.bones[child_name]
    current_direction = child.head - bone.head
    if current_direction.length_squared <= 1e-12:
        return
    delta = current_direction.normalized().rotation_difference(
        Vector(target_direction).normalized()
    )
    pivot = bone.head.copy()
    transform = (
        Matrix.Translation(pivot)
        @ delta.to_matrix().to_4x4()
        @ Matrix.Translation(-pivot)
    )
    bone.matrix = transform @ bone.matrix
    bpy.context.view_layer.update()


def key_pose(
    rig: bpy.types.Object,
    frame: int,
    hips_drop_centimetres: float,
    rotations: tuple[tuple[str, tuple[float, float, float], float], ...],
    arm_directions: tuple[
        tuple[float, float, float],
        tuple[float, float, float],
    ]
    | None,
) -> None:
    reset_pose(rig)
    bpy.context.view_layer.update()
    hips = rig.pose.bones["Hips"]
    hips.matrix = (
        Matrix.Translation((0.0, 0.0, -hips_drop_centimetres)) @ hips.matrix
    )
    bpy.context.view_layer.update()
    for bone_name, axis, degrees in rotations:
        rotate_bone_in_armature_space(rig, bone_name, axis, degrees)
    if arm_directions:
        left_upper, left_lower = arm_directions
        right_upper = (-left_upper[0], left_upper[1], left_upper[2])
        right_lower = (-left_lower[0], left_lower[1], left_lower[2])
        aim_bone_in_armature_space(
            rig, "LeftArm", "LeftForeArm", left_upper
        )
        aim_bone_in_armature_space(
            rig, "LeftForeArm", "LeftHand", left_lower
        )
        aim_bone_in_armature_space(
            rig, "RightArm", "RightForeArm", right_upper
        )
        aim_bone_in_armature_space(
            rig, "RightForeArm", "RightHand", right_lower
        )
    for bone in rig.pose.bones:
        bone.keyframe_insert(
            data_path="rotation_quaternion",
            frame=frame,
            group=bone.name,
        )
    rig.pose.bones["Hips"].keyframe_insert(
        data_path="location",
        frame=frame,
        group="Hips",
    )


def author_jump(rig: bpy.types.Object) -> bpy.types.Action:
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.render.fps_base = 1
    scene.frame_start = 0
    scene.frame_end = FRAME_END

    action = bpy.data.actions.new(CLIP_NAME)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action

    # Blender uses X left/right, Y front/back, Z up for these imported rigs.
    # The leg sequence below is a symmetric two-footed squat: both thighs
    # rotate toward -Y, both shins counter-rotate toward planted feet, and the
    # pelvis drops 8.4 cm at maximum compression. The 0.9 s timing aligns with
    # the runtime's 0.2 s anticipation, ~0.46 s parabola, and 0.24 s recovery.
    # The arms swing behind the torso during loading, pass forward through
    # shoulder height at take-off, then finish on a bent-elbow forward-up arc.
    # Keeping those three stages separate avoids the former straight overhead
    # lift, which read as a rigid vertical translation rather than momentum.
    lateral_axis = (1.0, 0.0, 0.0)

    def body_pose(
        thigh: float,
        knee: float,
        foot: float,
        spine: float,
    ) -> tuple[tuple[str, tuple[float, float, float], float], ...]:
        return (
            ("LeftUpLeg", lateral_axis, thigh),
            ("RightUpLeg", lateral_axis, thigh),
            ("LeftLeg", lateral_axis, knee),
            ("RightLeg", lateral_axis, knee),
            ("LeftFoot", lateral_axis, foot),
            ("RightFoot", lateral_axis, foot),
            ("Spine", lateral_axis, spine),
            ("Spine01", lateral_axis, spine * 0.45),
        )

    poses = (
        (0, 0.0, body_pose(0, 0, 0, 0), None),
        (
            5,
            3.7,
            body_pose(-15, 31, -16, 6),
            ((0.18, 0.55, -0.82), (0.10, 0.05, -0.99)),
        ),
        (
            9,
            8.4,
            body_pose(-35, 74, -39, 11),
            ((0.20, 0.70, -0.69), (0.10, 0.16, -0.98)),
        ),
        (
            12,
            0.0,
            body_pose(-3, 6, -3, -3),
            ((0.22, -0.97, 0.12), (0.22, -0.72, 0.66)),
        ),
        (
            16,
            0.0,
            body_pose(-7, 15, -8, -3),
            ((0.24, -0.92, 0.31), (0.23, -0.48, 0.85)),
        ),
        (
            24,
            0.0,
            body_pose(-11, 29, -18, -2),
            ((0.25, -0.85, 0.46), (0.22, -0.32, 0.92)),
        ),
        (
            35,
            0.0,
            body_pose(-8, 18, -10, 1),
            ((0.28, -0.94, 0.18), (0.20, -0.72, 0.66)),
        ),
        (
            39,
            6.2,
            body_pose(-29, 64, -34, 10),
            ((0.20, 0.56, -0.80), (0.12, 0.08, -0.99)),
        ),
        (
            45,
            3.2,
            body_pose(-15, 32, -17, 5),
            ((0.15, 0.18, -0.97), (0.07, -0.04, -1.0)),
        ),
        (
            50,
            0.8,
            body_pose(-4, 8, -4, 1),
            ((0.11, 0.05, -0.99), (0.05, 0.02, -1.0)),
        ),
        (54, 0.0, body_pose(0, 0, 0, 0), None),
    )
    for frame, hips_drop_centimetres, rotations, arm_directions in poses:
        key_pose(
            rig,
            frame,
            hips_drop_centimetres,
            rotations,
            arm_directions,
        )

    # Smooth between the authored poses without overshooting knees or elbows.
    if hasattr(action, "fcurves"):
        for curve in action.fcurves:
            for point in curve.keyframe_points:
                point.interpolation = "BEZIER"
                point.handle_left_type = "AUTO_CLAMPED"
                point.handle_right_type = "AUTO_CLAMPED"

    scene.frame_set(0)
    return action


def export_animation_source(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_frame_range=True,
        export_frame_step=1,
        export_skins=True,
        export_morph=False,
    )


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def deformed_mesh_minimum_z(scene: bpy.types.Scene) -> float:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    minimum_z = math.inf
    for obj in scene.objects:
        if obj.type != "MESH" or obj.hide_render:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            if mesh.vertices:
                minimum_z = min(
                    minimum_z,
                    min(
                        (evaluated.matrix_world @ vertex.co).z
                        for vertex in mesh.vertices
                    ),
                )
        finally:
            evaluated.to_mesh_clear()
    if not math.isfinite(minimum_z):
        raise RuntimeError("Jump preview has no evaluated mesh vertices")
    return minimum_z


def render_previews(rig: bpy.types.Object, preview_dir: Path) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 480
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.055, 0.07, 0.08)

    scene.frame_set(0)
    bpy.context.view_layer.update()
    mesh_corners = [
        obj.matrix_world @ Vector(corner)
        for obj in scene.objects
        if obj.type == "MESH" and not obj.hide_render
        for corner in obj.bound_box
    ]
    if not mesh_corners:
        raise RuntimeError("Jump preview has no renderable mesh bounds")
    minimum = Vector(
        tuple(min(point[index] for point in mesh_corners) for index in range(3))
    )
    maximum = Vector(
        tuple(max(point[index] for point in mesh_corners) for index in range(3))
    )
    center = (minimum + maximum) / 2
    height = max(maximum.z - minimum.z, 0.01)
    print(f"Preview bounds: min={tuple(minimum)}, max={tuple(maximum)}")

    camera_data = bpy.data.cameras.new("JumpPreviewCamera")
    camera = bpy.data.objects.new("JumpPreviewCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = height * 1.25
    camera.location = center + Vector((height * 1.5, -height * 2.2, height * 0.45))
    look_at(camera, center)

    key = bpy.data.lights.new("JumpPreviewKey", "AREA")
    key.energy = 650
    key.shape = "DISK"
    key.size = 3.0
    key_object = bpy.data.objects.new("JumpPreviewKey", key)
    bpy.context.collection.objects.link(key_object)
    key_object.location = center + Vector((-height * 1.6, -height * 1.7, height * 2.0))
    look_at(key_object, center)

    fill = bpy.data.lights.new("JumpPreviewFill", "AREA")
    fill.energy = 380
    fill.size = 2.5
    fill_object = bpy.data.objects.new("JumpPreviewFill", fill)
    bpy.context.collection.objects.link(fill_object)
    fill_object.location = center + Vector((height * 1.7, height, height * 1.2))
    look_at(fill_object, center)

    for frame in (0, 5, 9, 12, 16, 24, 35, 39, 45, 50, 54):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        print(
            f"Jump frame {frame:02d} deformed minimum Z: "
            f"{deformed_mesh_minimum_z(scene):.4f} cm"
        )
        scene.render.filepath = str(preview_dir / f"jump-{frame:02d}.png")
        bpy.ops.render.render(write_still=True)
    scene.frame_set(0)
    bpy.context.view_layer.objects.active = rig


def main() -> None:
    args = parse_args()
    input_path = args.input.expanduser().resolve()
    output_path = args.output.expanduser().resolve()
    if not input_path.is_file():
        raise FileNotFoundError(input_path)

    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(input_path))
    rig = imported_armature()
    clear_imported_animation(rig)
    action = author_jump(rig)
    export_animation_source(output_path)
    if args.preview_dir:
        render_previews(rig, args.preview_dir.expanduser().resolve())
    print(
        f"Authored {action.name}: {FRAME_END / FPS:.3f}s, "
        f"{len(rig.pose.bones)} bones, {output_path}"
    )


if __name__ == "__main__":
    main()

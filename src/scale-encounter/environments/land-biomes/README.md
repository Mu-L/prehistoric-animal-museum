# Dormant procedural land-biome candidate boundary

The Gobi, Kayenta floodplain and Carboniferous wetland presets remain pure-data
modules, but they are not part of the visible comparison runtime. Their theme
registrations currently resolve through the reviewed Cretaceous forest
compatibility fallback. The encounter therefore loads only the forest package;
none of these three candidate modules or their textures are requested when the
comparison route opens.

The candidate loader remains available for isolated review. When called from a
review or test harness it dynamically imports one selected preset and loads only
that theme's ground/depth package, never all three at once. Promotion back into
the product requires a new complete visual-quality review.

The dormant renderer does not enlarge a generated landscape illustration over an
equirectangular sphere. A shared licensed 8K pure-sky plate contributes only
clouds and distant atmospheric radiance. Readable basin ridges, terrain,
riverbanks, water, scanned props and vegetation are depth-writing world-space
geometry, so their sharpness and parallax do not depend on panorama resolution.

The Kayenta theme uses a terrain-cut, meandering seasonal reach with integrated
wet-mud banks. The Carboniferous theme uses separate irregular peat pools
instead of an engineered-looking straight canal. Both share a moving
procedural water-normal field, and their selected-theme terrain mesh has enough
world-space resolution to resolve the banks without exposing triangular water
fragments. The Gobi ground uses synchronized stochastic sampling for albedo,
normal and roughness instead of repeating its two-metre scan as a visible
square grid.

The Gobi treatment follows the Iren Dabasu evidence for a braided fluvial
system with a broad vegetated floodplain and temporary ponds, not an empty dune
desert. The Kayenta treatment combines reddish sediment, seasonal channels and
riparian conifer depth, including fixed crossed world-space profiles in the
far colonies rather than a landscape plate. The Carboniferous treatment is
built from sparse emergent lycopsids, calamite/sphenopsid and three overlapping
supported tree-fern depth bands. It deliberately contains no modern flowering
broadleaf canopy.

Scientific source URLs live beside each preset. The pure-sky, scanned ecology
and atlas sources are recorded in the repository environment provenance file.
Borrowed cache textures are detached before ordinary scene-graph disposal;
locally generated water normals, geometry and materials are disposed with the
active environment.

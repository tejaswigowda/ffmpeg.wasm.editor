// Shim for three-bvh-csg - provides empty export for offline support
// This prevents "Failed to resolve module specifier" errors when running offline

export default {};
export const BSP = {};
export const Brush = class Brush {};
export const Operation = {};

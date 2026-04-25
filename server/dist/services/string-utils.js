export function slugifyProjectName(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'hytale-mod';
}
export function sanitizePackageName(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.|\.$/g, '') || 'com.example.mod';
}
export function sanitizeClassName(value) {
    const cleaned = value.replace(/[^A-Za-z0-9_]/g, '') || 'Main';
    return cleaned[0].toUpperCase() + cleaned.slice(1);
}
export function parseMainClass(value, group) {
    const sanitizedGroup = sanitizePackageName(group);
    if (value.includes('.')) {
        const parts = value.split('.');
        const className = sanitizeClassName(parts.pop() || 'Main');
        const packageName = sanitizePackageName(parts.join('.'));
        return { packageName, className, fullMainClass: `${packageName}.${className}` };
    }
    const className = sanitizeClassName(value);
    return { packageName: sanitizedGroup, className, fullMainClass: `${sanitizedGroup}.${className}` };
}
export function deriveManifestGroup(value) {
    const parts = sanitizePackageName(value).split('.').filter(Boolean);
    return parts.length > 1 ? parts.slice(0, -1).join('.') : sanitizePackageName(value);
}
export function escapeJavaString(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
export function escapeGradleString(value) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Safe implementations of functions to be used during deobfuscation
 */
export const atob = (await import('./safe-atob.js')).atob;
export const btoa = (await import('./safe-btoa.js')).btoa;
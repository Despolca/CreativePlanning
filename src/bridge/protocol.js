/* Giao thức giao tiếp iframe: Giới hạn nguồn tin nhắn, các trường cài đặt được phép và 5 biến theme. */
import { defaults, promptDefaults } from '../planning/core.js?v=0.5.0';
export const CHANNEL = 'creative-planning-v1';
export const THEME_KEYS = Object.freeze(['--SmartThemeBorderColor', '--SmartThemeBlurTintColor', '--SmartThemeBodyColor', '--mainFontFamily', '--monoFontFamily']);
export function themeSnapshot(style) {
    return Object.fromEntries(THEME_KEYS.map(key => [key, style.getPropertyValue(key).trim()]));
}
export function acceptsMessage(event, source, origin) {
    return Boolean(source && event.source === source && event.origin === origin && event.data?.channel === CHANNEL && typeof event.data.type === 'string');
}
export function cleanSettings(value) {
    if (!value || typeof value !== 'object') return {};
    return Object.fromEntries(Object.entries({...defaults,...promptDefaults}).filter(([key, initial]) =>
        typeof value[key] === typeof initial && (typeof initial !== 'number' || Number.isFinite(value[key]))
    ).map(([key]) => [key, value[key]]));
}
const METHODS = new Set(['state.read', 'settings.update', 'api.save', 'api.remove', 'api.models', 'scheme.loadCurrent', 'scheme.save', 'scheme.remove', 'selection.update', 'sources.refresh', 'planner.cancel', 'ui.close']);
export function validateRpc(data) {
    if (!data || typeof data.requestId !== 'string' || data.requestId.length > 100 || !METHODS.has(data.method)) throw new Error('Yêu cầu giao diện không hợp lệ.');
    if (JSON.stringify(data.payload).length > 262144) throw new Error('Yêu cầu giao diện quá lớn.');
    const visit = value => {
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Trường yêu cầu giao diện không hợp lệ.');
            visit(child);
        }
    };
    visit(data.payload);
    return data;
}
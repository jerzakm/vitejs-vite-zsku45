import { writable } from 'svelte/store';

export const humanGroup1 = writable([]);
export const humanGroup2 = writable([]);
export const humanGroup3 = writable([]);
export const currentDate = writable(new Date(2023, 0, 1));
export const adultModified = writable(false);
export const childModified = writable(false);
export const isMobile = writable(false);
export const renderFlag = writable(false);
export const clusterData = writable([]);

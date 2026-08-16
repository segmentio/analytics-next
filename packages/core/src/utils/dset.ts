export function dset<T extends object, V>(obj: T, path: string, val: V) {
  const keys = path.split('.');

  keys.reduce((acc: any, key, i) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return {};
    }

    if (i === keys.length - 1) {
      acc[key] = val;
    } else {
      acc[key] ??= {};
    }

    return acc[key];
  }, obj);
}

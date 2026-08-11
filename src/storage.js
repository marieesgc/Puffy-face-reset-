// Real, permanent browser storage — works on any hosted site, no backend required.
// Data lives in this browser/device only (same limitation the temporary version had).
// Same shape as Claude's preview storage (get/set/delete, all async) so the rest of
// App.jsx didn't need to change.

const storage = {
  async get(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value === null) return null;
      return { key, value };
    } catch (err) {
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return { key, value };
    } catch (err) {
      return null;
    }
  },
  async delete(key) {
    try {
      window.localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (err) {
      return null;
    }
  },
};

export default storage;

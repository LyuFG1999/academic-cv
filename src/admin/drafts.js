const database = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('academic-cv-editor', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('drafts');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('浏览器不允许保存本地草稿。请勿关闭页面。'));
});
export async function draftStore(action, key, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', action === 'get' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('drafts');
      const request = action === 'put' ? store.put(value, key) : action === 'delete' ? store.delete(key) : store.get(key);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(new Error('本地草稿保存失败（可能空间不足）。输入仍在此页面，请勿关闭。'));
    });
  } finally { db.close(); }
}

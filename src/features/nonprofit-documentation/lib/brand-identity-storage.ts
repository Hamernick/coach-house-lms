import type { BrandAssetId, StoredBrandAsset } from "../types"

const DATABASE_NAME = "coach-house-documentation"
const STORE_NAME = "brand-identity-assets"
const DATABASE_VERSION = 1

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const request = operation(transaction.objectStore(STORE_NAME))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error)
      })
  )
}

export function loadBrandAssets() {
  if (typeof indexedDB === "undefined") return Promise.resolve([])
  return transact<StoredBrandAsset[]>("readonly", (store) => store.getAll())
}

export function saveBrandAsset(asset: StoredBrandAsset) {
  return transact<IDBValidKey>("readwrite", (store) => store.put(asset))
}

export function removeBrandAsset(id: BrandAssetId) {
  return transact<undefined>("readwrite", (store) => store.delete(id))
}

export function clearBrandAssets() {
  return transact<undefined>("readwrite", (store) => store.clear())
}

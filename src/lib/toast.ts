let modulePromise: Promise<typeof import("sonner")> | null = null
let loadedModule: typeof import("sonner") | null = null
let idCounter = 0

function loadModule() {
  if (loadedModule) {
    return Promise.resolve(loadedModule)
  }
  if (!modulePromise) {
    modulePromise = import("sonner").then((mod) => {
      loadedModule = mod
      return mod
    })
  }
  return modulePromise
}

function withToast(callback: (toastImpl: any) => void) {
  void loadModule().then((mod) => {
    callback(mod.toast)
  })
}

function ensureOptions(options?: Record<string, unknown>) {
  const final = { ...(options ?? {}) }
  if (final.id === undefined) {
    final.id = `lazy-toast-${++idCounter}`
  }
  return final
}

const toast: any = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl(message, finalOptions))
  return finalOptions.id
}

toast.success = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.success(message, finalOptions))
  return finalOptions.id
}

toast.error = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.error(message, finalOptions))
  return finalOptions.id
}

toast.warning = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.warning(message, finalOptions))
  return finalOptions.id
}

toast.info = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.info(message, finalOptions))
  return finalOptions.id
}

toast.loading = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.loading(message, finalOptions))
  return finalOptions.id
}

toast.message = (message: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.message(message, finalOptions))
  return finalOptions.id
}

toast.custom = (renderer: unknown, options?: Record<string, unknown>) => {
  const finalOptions = ensureOptions(options)
  withToast((toastImpl) => toastImpl.custom(renderer as never, finalOptions))
  return finalOptions.id
}

toast.dismiss = (id?: string) => {
  withToast((toastImpl) => toastImpl.dismiss(id))
}

toast.promise = <T,>(
  promise: Promise<T>,
  handlers: Record<string, unknown>,
  options?: Record<string, unknown>,
) => {
  withToast((toastImpl) => toastImpl.promise(promise, handlers as never, options as never))
  return promise
}

export { toast }

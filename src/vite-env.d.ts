
/// <reference types="vite/client" />

interface Window {
  SharedWorker: typeof SharedWorker;
}

declare module '*.worker.ts' {
  const SharedWorkerFactory: new () => SharedWorker;
  export default SharedWorkerFactory;
}

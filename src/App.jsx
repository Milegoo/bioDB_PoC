import { useState, useEffect } from 'react'
import './App.css'
import { createDbWorker } from "sql.js-httpvfs"

// sadly there's no good way to package workers and wasm directly so you need a way to get these two URLs from your bundler.
// This is the webpack5 way to create a asset bundle of the worker and wasm:
const workerUrl = new URL(
  "sqlite.worker.js",
  `${window.location.origin}/bioDB_PoC/`
);
const wasmUrl = new URL(
  "sql-wasm.wasm",
  `${window.location.origin}/bioDB_PoC/`
);

console.log(workerUrl.toString())
console.log(wasmUrl.toString());

// the legacy webpack4 way is something like `import wasmUrl from "file-loader!sql.js-httpvfs/dist/sql-wasm.wasm"`.

// the config is either the url to the create_db script, or a inline configuration:
const config = {
  from: "inline",
  config: {
    serverMode: "full", // file is just a plain old full sqlite database
    requestChunkSize: 4096, // the page size of the  sqlite database (by default 4096)
    url: "/bioDB_PoC/pocBioDB.db" // url to the database (relative or full)
  }
};

function App() {
  const [data, setData] = useState(null)
  const [worker, setWorker] = useState(null);


  useEffect(() => {
    async function initWorker() {
      try {
        let maxBytesToRead = 10 * 1024 * 1024;
        console.log("maxBytes");
        const dbWorker = await createDbWorker([config], workerUrl.toString(), wasmUrl.toString(), maxBytesToRead);
        console.log("Worker de SQLite creado");
        setWorker(dbWorker);
        console.log("Worker de SQLite inicializado");
      } catch (error) {
        console.error("Error al inicializar el worker:", error);
      }
    }
    initWorker();
  }, []);

  async function getBioSamples() {
    if (!worker) {
      console.error("El worker aún no está listo");
      return;
    }

    try {
      const result = await worker.db.query("SELECT * FROM biological_samples");
      setData(result);
    } catch (error) {
      console.error("Error al hacer la consulta:", error);
    }
  }

  return (
    <>
      <h1>Get biological samples</h1>
      <div className="card">
        <button onClick={() => getBioSamples()} className="btn">Get Samples</button>
      </div>
      <div>
        <h2>Biological samples</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </>
  )
}

export default App
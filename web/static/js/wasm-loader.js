(async () => {
  if (!WebAssembly.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return await WebAssembly.instantiate(source, importObject);
    };
  }

  const go = new Go();
  const result = await WebAssembly.instantiateStreaming(fetch("/static/wasm/app.wasm"), go.importObject);
  go.run(result.instance);
})().catch((err) => {
  console.error("WASM load failed:", err);
});

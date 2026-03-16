package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("web/static"))))
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))
	mux.Handle("/content/", http.StripPrefix("/content/", http.FileServer(http.Dir("content"))))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pwa Idle Game</title>
  <link rel="stylesheet" href="/static/css/output.css">
</head>
<body>
  <main class="min-h-screen p-6">
    <h1 class="text-3xl font-bold">Pwa Idle Game</h1>
    <p class="mt-4">Standard Go migration scaffold is live.</p>
  </main>
  <script src="/static/js/wasm_exec.js"></script>
  <script src="/static/js/wasm-loader.js"></script>
</body>
</html>`))
	})

	log.Println("serving on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

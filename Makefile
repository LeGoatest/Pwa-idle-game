GO=go
TINYGO=tinygo
TAILWIND=npx @tailwindcss/cli
TEMPL=templ

.PHONY: generate buildsite buildcss buildwasm build clean

generate:
	$(TEMPL) generate

buildsite: generate
	$(GO) run ./cmd/buildsite

buildcss:
	mkdir -p dist/static/css
	$(TAILWIND) -i ./input.css -o ./dist/static/css/output.css --minify

buildwasm:
	mkdir -p dist/static/wasm
	$(TINYGO) build -target wasm -opt=z -no-debug -o ./dist/static/wasm/app.wasm ./frontend/wasm

buildruntime:
	mkdir -p dist/static/js
	cp ./web/static/js/*.js ./dist/static/js/
	cp "$$($(GO) env GOROOT)/lib/wasm/wasm_exec.js" ./dist/static/js/wasm_exec.js

buildcontent:
	mkdir -p dist/content
	mkdir -p dist/assets
	cp -R ./content/. ./dist/content/
	cp -R ./assets/. ./dist/assets/

build: buildsite buildcss buildwasm buildruntime buildcontent

clean:
	rm -rf dist

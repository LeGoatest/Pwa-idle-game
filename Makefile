GO=go
TINYGO=tinygo
TAILWIND=npx @tailwindcss/cli

.PHONY: run build build-server build-wasm build-css test simulate validate-content clean

run:
	$(GO) run ./cmd/web

build:
	$(MAKE) build-server
	$(MAKE) build-css
	$(MAKE) build-wasm

build-server:
	mkdir -p build
	$(GO) build -o build/server ./cmd/web

build-wasm:
	mkdir -p web/static/wasm
	$(TINYGO) build -target wasm -opt=z -no-debug -o web/static/wasm/app.wasm ./frontend/wasm

build-css:
	mkdir -p web/static/css
	$(TAILWIND) -i ./input.css -o ./web/static/css/output.css --minify

test:
	$(GO) test ./...

simulate:
	$(GO) run ./cmd/simulate

validate-content:
	$(GO) run ./cmd/content-validate

clean:
	rm -rf build
	rm -f web/static/wasm/app.wasm

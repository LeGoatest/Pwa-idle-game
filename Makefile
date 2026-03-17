GO=go
TINYGO=tinygo
TAILWIND=npx @tailwindcss/cli
TEMPL=templ

.PHONY: generate buildsite buildcss buildwasm buildruntime buildcontent validate simulate build clean

generate:
	$(TEMPL) generate

buildsite: generate
	$(GO) run ./cmd/buildsite

buildcss:
	mkdir -p dist/static/css
	$(TAILWIND) -i ./input.css -o ./dist/static/css/app.css --minify

buildwasm:
	mkdir -p dist/static/wasm
	$(TINYGO) build -target wasm -opt=z -no-debug -o ./dist/static/wasm/app.wasm ./frontend/wasm

buildruntime:
	mkdir -p dist/static/js
	cp ./web/static/js/*.js ./dist/static/js/
	if [ -f "$$($(TINYGO) env TINYGOROOT)/targets/wasm_exec.js" ]; then \
		cp "$$($(TINYGO) env TINYGOROOT)/targets/wasm_exec.js" ./dist/static/js/wasm_exec.js; \
	elif [ -f "$$($(GO) env GOROOT)/lib/wasm/wasm_exec.js" ]; then \
		cp "$$($(GO) env GOROOT)/lib/wasm/wasm_exec.js" ./dist/static/js/wasm_exec.js; \
	elif [ -f "$$($(GO) env GOROOT)/misc/wasm/wasm_exec.js" ]; then \
		cp "$$($(GO) env GOROOT)/misc/wasm/wasm_exec.js" ./dist/static/js/wasm_exec.js; \
	else \
		echo "wasm_exec.js not found in TinyGo or Go toolchain"; \
		exit 1; \
	fi

buildcontent:
	$(GO) run ./cmd/buildcontent
	cp -R ./content/. ./dist/content/
	cp -R ./assets/. ./dist/assets/

validate:
	$(GO) run ./cmd/content-validate

simulate:
	$(GO) run ./cmd/simulate

build: buildsite buildcss buildwasm buildruntime buildcontent

clean:
	rm -rf dist

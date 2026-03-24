GO=go
TINYGO=tinygo
TAILWIND=npx @tailwindcss/cli
TEMPL=templ

OUT_DIR ?= dist

.PHONY: generate buildsite buildcss buildwasm buildruntime buildcontent validate simulate build clean

generate:
	$(TEMPL) generate

buildsite: generate
	mkdir -p $(OUT_DIR)
	$(GO) run ./cmd/buildsite

buildcss:
	mkdir -p $(OUT_DIR)/static/css
	$(TAILWIND) -i ./input.css -o ./$(OUT_DIR)/static/css/app.css --minify

buildwasm:
	mkdir -p $(OUT_DIR)/static/wasm
	$(TINYGO) build -target wasm -opt=z -no-debug -o ./$(OUT_DIR)/static/wasm/app.wasm ./frontend/wasm

buildruntime:
	mkdir -p $(OUT_DIR)/static/js
	cp ./web/static/js/*.js ./$(OUT_DIR)/static/js/
	if [ -f "$$($(TINYGO) env TINYGOROOT)/targets/wasm_exec.js" ]; then \
		cp "$$($(TINYGO) env TINYGOROOT)/targets/wasm_exec.js" ./$(OUT_DIR)/static/js/wasm_exec.js; \
	elif [ -f "$$($(GO) env GOROOT)/lib/wasm/wasm_exec.js" ]; then \
		cp "$$($(GO) env GOROOT)/lib/wasm/wasm_exec.js" ./$(OUT_DIR)/static/js/wasm_exec.js; \
	elif [ -f "$$($(GO) env GOROOT)/misc/wasm/wasm_exec.js" ]; then \
		cp "$$($(GO) env GOROOT)/misc/wasm/wasm_exec.js" ./$(OUT_DIR)/static/js/wasm_exec.js; \
	else \
		echo "wasm_exec.js not found in TinyGo or Go toolchain"; \
		exit 1; \
	fi

buildcontent:
	mkdir -p $(OUT_DIR)/content
	mkdir -p $(OUT_DIR)/assets
	$(GO) run ./cmd/buildcontent
	cp -R ./content/. ./$(OUT_DIR)/content/
	cp -R ./assets/. ./$(OUT_DIR)/assets/

validate:
	$(GO) run ./cmd/content-validate

simulate:
	$(GO) run ./cmd/simulate

build: buildsite buildcss buildwasm buildruntime buildcontent

clean:
	rm -rf $(OUT_DIR)

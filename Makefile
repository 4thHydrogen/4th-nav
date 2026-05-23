build:
	@echo "Building frontend..."
	@cd ui && corepack pnpm build
	@echo "Building backend..."
	@go build -o van-nav .

run-ui:
	@cd ui && corepack pnpm dev

run-api:
	@go run .

run:
	@echo "Run backend and frontend in separate terminals:"
	@echo "  make run-api"
	@echo "  make run-ui"

clean:
	@echo "Cleaning..."
	@powershell -Command "Remove-Item -Recurse -Force public -ErrorAction SilentlyContinue; Remove-Item -Force van-nav.exe,van-nav -ErrorAction SilentlyContinue"

.PHONY: build run-ui run-api run clean

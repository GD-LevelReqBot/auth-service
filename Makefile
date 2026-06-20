IMAGE := gdlqbot-auth-service

build:
	docker build --no-cache --pull --build-arg CACHEBUST=$(shell date +%s) -t $(IMAGE) .

run:
	docker run --rm --env-file .env -p 3000:3000 $(IMAGE)

deploy: build run

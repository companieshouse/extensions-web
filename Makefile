artifact_name       := extensions-web

.PHONY: all
all: build

.PHONY: githooks
githooks:
	git config core.hooksPath .githooks

.PHONY: clean
clean:
	rm -f ./$(artifact_name)-*.zip
	rm -rf ./build-*
	rm -rf ./dist
	rm -f ./build.log

package-install:
	npm i

.PHONY: build
build:	package-install lint update_submodules
	npm run build

.PHONY: lint
lint:
	npm run lint

.PHONY: sonar
sonar:
	npm run sonarqube

.PHONY: test
test: test-unit test-integration
	npm run test

.PHONY: test-unit
test-unit:
	npm run unit

.PHONY: test-integration
test-integration:
	npm run integration

.PHONY: test-contract-consumer
test-contract-consumer:
	rm -rf pacts/
	npm run contract-consumer

.PHONY: package
package: build
ifndef version
	$(error No version given. Aborting)
endif
	$(info Packaging version: $(version))
	$(eval tmpdir := $(shell mktemp -d build-XXXXXXXXXX))
	cp -r ./dist/* $(tmpdir)
	mkdir $(tmpdir)/api-enumerations
	cp ./api-enumerations/*.yml $(tmpdir)/api-enumerations
	cp -r ./package.json $(tmpdir)
	cp -r ./package-lock.json $(tmpdir)
	cp ./start.sh $(tmpdir)
	cp ./routes.yaml $(tmpdir)
	cd $(tmpdir) && npm i --production
	rm $(tmpdir)/package.json $(tmpdir)/package-lock.json
	cd $(tmpdir) && zip -r ../$(artifact_name)-$(version).zip .
	rm -rf $(tmpdir)

.PHONY: dist
dist: lint test clean build package

.PHONY: update_submodules
update_submodules:
	test -f ./api-enumerations/constants.yml || git submodule update --init -- api-enumerations

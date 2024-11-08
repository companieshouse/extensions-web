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
sonar: test
	npm run sonarqube

.PHONY: test
test:
	npm run sonar-test

.PHONY: test-unit
test-unit: clean
	# 'ECS pipeline calls test-unit so need to run sonar-test here'
	npm run sonar-test

.PHONY: test-integration
test-integration:
	npm run integration

.PHONY: security-check
security-check:
	npm audit --audit-level=high

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
	cd $(tmpdir) && npm i --production
	rm $(tmpdir)/package.json $(tmpdir)/package-lock.json
	cd $(tmpdir) && zip -r ../$(artifact_name)-$(version).zip .
	rm -rf $(tmpdir)

.PHONY: dist
dist: lint test-unit clean build package

.PHONY: update_submodules
update_submodules:
	test -f ./api-enumerations/constants.yml || git submodule update --init -- api-enumerations

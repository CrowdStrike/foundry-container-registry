APP = foundry-container-registry
VERSION = $(shell git describe --tags)
GO_VERSION = $(shell echo "$(VERSION)" | sed "s/v//g" | cut -d "-" -f1)
PACKAGE_NAME = $(APP)-$(VERSION).tar.gz

PLATFORM = $(shell uname)

ifeq ($(PLATFORM),Darwin)
	# macOS
	SED_COMMAND = sed -i '' 's/0.0.0-dev/$(GO_VERSION)/g'
else
	# Linux and others
	SED_COMMAND = sed -i 's/0.0.0-dev/$(GO_VERSION)/g'
endif

.PHONY: package
package: build
	mkdir -p out out/ui/pages
	# update version in version.go to a release version
	$(SED_COMMAND) functions/syncimages/version/version.go
	# copy as-is files and directories
	cp -r LICENSE manifest.yml collections functions out
	# copy just the built pages, not their source
	cp -r ui/pages/dist out/ui/pages
	$(shell echo "$(VERSION)" > out/VERSION)
	tar -czvf $(PACKAGE_NAME) -C out .

.PHONY: build
build:
	cd ui/pages && npm run build

.PHONY: clean
clean:
	rm -rf ui/pages/dist out *.tar.gz

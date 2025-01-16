.PHONY: package build clean

APP = foundry-container-registry
VERSION = $(shell git describe --tags)
PACKAGE_NAME = $(APP)-$(VERSION).tar.gz

package: build
	-mkdir out
	# copy as-is files and directories
	cp -r collections functions out
	cp LICENSE manifest.yml out
	# copy just the built pages, not their source
	-mkdir -p out/ui/pages
	cp -r ui/pages/dist out/ui/pages
	git describe --all > out/VERSION
	tar -czvf $(PACKAGE_NAME) -C out .

build: ui/pages/dist

ui/pages/dist:
	cd ui/pages && npm run build

clean:
	-rm -rf ui/pages/dist out *.tar.gz
	-rm $(APP)-*.tar.gz

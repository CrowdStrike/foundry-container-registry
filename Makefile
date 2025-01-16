APP = foundry-container-registry
VERSION = $(shell git describe --tags)
PACKAGE_NAME = $(APP)-$(VERSION).tar.gz

.PHONY: package
package: build
	mkdir -p out out/ui/pages
	# copy as-is files and directories
	cp -r LICENSE manifest.yml collections functions out
	# copy just the built pages, not their source
	cp -r ui/pages/dist out/ui/pages
	git describe --all > out/VERSION
	tar -czvf $(PACKAGE_NAME) -C out .

.PHONY: build
build:
	cd ui/pages && npm run build

.PHONY: clean
clean:
	rm -rf ui/pages/dist out *.tar.gz

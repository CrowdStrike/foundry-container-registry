.PHONY: package build clean

PACKAGE_NAME = foundry-container-registry-$(shell git describe --tags).tar.gz

package: build
	-mkdir out
	cp -r collections functions out
	-mkdir -p out/ui/pages
	cp -r ui/pages/dist out/ui/pages
	cp LICENSE out
	# grep -v 'id:' manifest.yml > out/manifest.yml
	cp manifest.yml out
	git describe --all > out/VERSION
	tar -czvf $(PACKAGE_NAME) -C out .

build: ui/pages/dist

ui/pages/dist:
	cd ui/pages && npm run build

clean:
	-rm -rf ui/pages/dist out

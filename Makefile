APP = foundry-container-registry
VERSION = $(shell git describe --tags)
GO_VERSION = $(shell echo "$(VERSION)" | sed "s/v//g" | cut -d "-" -f1)
PACKAGE_NAME = $(APP)-$(VERSION).tar.gz

PLATFORM = $(shell uname)
UI_DIR = ui/pages

ifeq ($(PLATFORM),Darwin)
	# macOS
	SED_COMMAND = sed -i '' 's/0.0.0-dev/$(GO_VERSION)/g'
else
	# Linux and others
	SED_COMMAND = sed -i 's/0.0.0-dev/$(GO_VERSION)/g'
endif

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk command is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: package
package: build ## Package the application for distribution.
	mkdir -p out out/ui/pages
	# update version in version.go to a release version
	$(SED_COMMAND) functions/syncimages/version/version.go
	# copy as-is files and directories
	cp -r LICENSE manifest.yml collections functions out
	# copy just the built pages, not their source
	cp -r ui/pages/dist out/ui/pages
	$(shell echo "$(VERSION)" > out/VERSION)
	tar -czvf $(PACKAGE_NAME) -C out .

.PHONY: install
install: ## Install the NPM dependencies.
	npm install --prefix $(UI_DIR)

.PHONY: build
build: install ## Build the UI.
	npm run build --prefix $(UI_DIR)

.PHONY: clean
clean: ## Clean up the build artifacts.
	rm -rf ui/pages/dist out *.tar.gz

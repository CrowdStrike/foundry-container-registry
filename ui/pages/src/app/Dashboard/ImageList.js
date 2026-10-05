var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useFoundry } from "@crowdstrike/alloy-react";
import { Alert, Button, DataList, EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateFooter, Grid, GridItem, Skeleton, Timestamp, Toolbar, ToolbarContent, ToolbarItem, } from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import * as React from "react";
import { ImageItem } from "./ImageItem";
var ImageList = function () {
    var _a = useFoundry(), falcon = _a.falcon, isInitialized = _a.isInitialized;
    var _b = React.useState(true), loading = _b[0], setLoading = _b[1];
    var _c = React.useState(null), error = _c[0], setError = _c[1];
    var _d = React.useState([]), images = _d[0], setImages = _d[1];
    var _e = React.useState(), updated = _e[0], setUpdated = _e[1];
    function setErrorSafe(e) {
        if (typeof e == "string") {
            setError(new Error(e));
        }
        else if (e instanceof Error) {
            setError(e);
        }
        else {
            setError(e[0]);
        }
    }
    function syncImages() {
        setLoading(true);
        falcon
            .cloudFunction({
            name: "syncimages",
        })
            .post({
            path: "/sync-images",
        })
            .then(loadImages)
            .catch(setErrorSafe)
            .finally(function () {
            setLoading(false);
        });
    }
    function loadImages() {
        if (!falcon || !isInitialized)
            return;
        falcon
            .collection({ collection: "images" })
            .read("all")
            .then(function (resp) {
            var imageResp = resp;
            // if (imageResp.errors && imageResp.errors.length > 0) {
            //   if (imageResp.errors[0].code == 404) {
            //     // collection hasn't been synced yet, do that now
            //     syncImages();
            //   } else {
            //     setErrorSafe(imageResp.errors[0].message);
            //   }
            //   return;
            // }
            imageResp.updated && setUpdated(imageResp.updated);
            imageResp.images && setImages(imageResp.images);
        })
            .catch(setErrorSafe)
            .finally(function () {
            setLoading(false);
        });
    }
    function deleteImages() {
        falcon.collection({ collection: "images" }).delete("all");
    }
    React.useEffect(loadImages, [isInitialized]);
    if (loading) {
        return (_jsxs(Grid, { children: [_jsx(GridItem, __assign({ span: 6 }, { children: _jsx(Skeleton, { width: "80%", fontSize: "3xl" }) })), _jsx(GridItem, __assign({ span: 6 }, { children: _jsx(Skeleton, { width: "60%", fontSize: "3xl" }) }))] }));
    }
    else {
        return (_jsxs(_Fragment, { children: [error && (_jsx(Alert, __assign({ variant: "danger", title: "Unexpected error" }, { children: _jsx("p", { children: error.message }) }))), (images.length == 0 && (_jsxs(EmptyState, __assign({ titleText: "No images synced", headingLevel: "h4", icon: CubesIcon }, { children: [_jsx(EmptyStateBody, { children: "Images haven't been synced from the CrowdStrike registry yet." }), _jsx(EmptyStateFooter, { children: _jsx(EmptyStateActions, { children: _jsx(Button, __assign({ variant: "primary", onClick: syncImages }, { children: "Sync images now" })) }) })] })))) || (_jsxs(_Fragment, { children: [_jsx(DataList, __assign({ "aria-label": "Mixed expandable data list example" }, { children: images.map(function (i) {
                                return _jsx(ImageItem, { image: i }, i.name);
                            }) })), _jsx(Toolbar, { children: _jsxs(ToolbarContent, { children: [_jsx(ToolbarItem, __assign({ alignSelf: "center" }, { children: _jsxs("p", { children: ["Last sync was", " ", _jsx(Timestamp, { date: updated, style: { fontSize: "var(--pf-v6-c-toolbar--FontSize)" } }), "."] }) })), _jsx(ToolbarItem, { children: _jsx(Button, __assign({ variant: "link", onClick: syncImages }, { children: "Sync images now" })) })] }) })] }))] }));
    }
};
export { ImageList };

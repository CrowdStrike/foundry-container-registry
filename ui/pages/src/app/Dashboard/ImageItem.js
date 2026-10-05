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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { DataListCell, DataListContent, DataListItem, DataListItemCells, DataListItemRow, DataListToggle, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Label, Pagination, PaginationVariant, Title, } from "@patternfly/react-core";
import { CubeIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";
export function ImageItem(_a) {
    var image = _a.image;
    var _b = React.useState(false), isExpanded = _b[0], setIsExpanded = _b[1];
    // Pagination state
    var _c = React.useState(1), page = _c[0], setPage = _c[1];
    var _d = React.useState(10), perPage = _d[0], setPerPage = _d[1];
    // Pagination handlers
    var onSetPage = function (_event, pageNumber) {
        setPage(pageNumber);
    };
    var onPerPageSelect = function (_event, newPerPage, newPage) {
        setPerPage(newPerPage);
        setPage(newPage);
    };
    // function shortDigest(longDigest : string) {
    //   if (longDigest.length < 19) {
    //     return longDigest;
    //   } else {
    //     return shortDigest.substring(0, 19);
    //   }
    // }
    // Calculate current page items
    var reversedTags = __spreadArray([], image.tags, true).reverse();
    var start = (page - 1) * perPage;
    var end = page * perPage;
    var currentPageTags = reversedTags.slice(start, end);
    return (_jsxs(DataListItem, __assign({ isExpanded: isExpanded }, { children: [_jsxs(DataListItemRow, { children: [_jsx(DataListToggle, { onClick: function () { return setIsExpanded(!isExpanded); }, isExpanded: isExpanded, id: image.name }), _jsx(DataListItemCells, { dataListCells: [
                            _jsx(DataListCell, __assign({ isIcon: true }, { children: _jsx(CubeIcon, {}) }), image.name + "-icon"),
                            _jsxs(DataListCell, { children: [_jsx(Title, __assign({ headingLevel: "h3", style: { marginBottom: "var(--pf-global--spacer--xs)" } }, { children: image.name })), _jsx("p", { children: image.description })] }, image.name + "-title"),
                            _jsx(DataListCell, { children: _jsxs(DescriptionList, { children: [_jsxs(DescriptionListGroup, { children: [_jsx(DescriptionListTerm, { children: "Latest tag" }), _jsx(DescriptionListDescription, { children: _jsx("code", { children: image.latest }) })] }), _jsxs(DescriptionListGroup, { children: [_jsx(DescriptionListTerm, { children: "Image path" }), _jsx(DescriptionListDescription, { children: _jsx("code", { children: image.repository }) })] })] }) }, image.name + "-info"),
                        ] })] }), _jsxs(DataListContent, __assign({ "aria-label": "Image details", isHidden: !isExpanded, className: "image-details" }, { children: [_jsx(Pagination, { itemCount: image.tags.length, perPage: perPage, page: page, onSetPage: onSetPage, onPerPageSelect: onPerPageSelect, variant: PaginationVariant.top, isCompact: true }), _jsxs(Table, __assign({ variant: "compact", borders: false, className: "tags-table" }, { children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Tag" }), _jsx(Th, __assign({ style: { minWidth: "fit-content", maxWidth: "100ch" } }, { children: "Architectures" })), _jsx(Th, { children: "Digest" })] }) }), _jsx(Tbody, { children: currentPageTags.map(function (t) { return (_jsxs(Tr, { children: [_jsx(Td, { children: _jsx("code", { children: t.name }) }), _jsx(Td, { children: t.arch.map(function (a) { return (_jsxs(_Fragment, { children: [_jsx(Label, __assign({ isCompact: true }, { children: a }), "".concat(t.name, "-").concat(a)), " "] })); }) }), _jsx(Td, { children: _jsx("code", { children: t.digest }) })] }, t.name)); }) })] }))] }))] })));
}

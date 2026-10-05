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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageSection, Title } from "@patternfly/react-core";
import { ImageList } from "./ImageList";
var Dashboard = function () { return (_jsxs(PageSection, __assign({ hasBodyWrapper: false }, { children: [_jsx(Title, __assign({ headingLevel: "h1", size: "lg" }, { children: "Images" })), _jsx(ImageList, {})] }))); };
export { Dashboard };

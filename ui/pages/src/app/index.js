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
import { jsx as _jsx } from "react/jsx-runtime";
import { ConsolePage } from "@crowdstrike/alloy-react";
import "@patternfly/react-core/dist/styles/base.css";
import "./app.css";
import { Dashboard } from "./Dashboard/Dashboard";
var App = function () { return (_jsx(ConsolePage, __assign({ title: "Container Registry" }, { children: _jsx(Dashboard, {}) }))); };
export default App;

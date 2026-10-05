import { jsx as _jsx } from "react/jsx-runtime";
import { FoundryProvider } from "@crowdstrike/alloy-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
if (process.env.NODE_ENV !== "production") {
    var config = {
        rules: [
            {
                id: "color-contrast",
                enabled: false,
            },
        ],
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    var axe = require("react-axe");
    axe(React, ReactDOM, 1000, config);
}
var root = ReactDOM.createRoot(document.getElementById("root"));
root.render(_jsx(React.StrictMode, { children: _jsx(FoundryProvider, { children: _jsx(App, {}) }) }));

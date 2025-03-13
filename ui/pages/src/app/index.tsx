import { ConsolePage } from "@crowdstrike/alloy-react";
import "@patternfly/react-core/dist/styles/base.css";
import * as React from "react";
import "./app.css";
import { Dashboard } from "./Dashboard/Dashboard";

const App: React.FunctionComponent = () => (
  <ConsolePage title="Container Registry">
    <Dashboard />
  </ConsolePage>
);

export default App;

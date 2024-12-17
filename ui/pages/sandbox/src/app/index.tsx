import * as React from "react";
import "@patternfly/react-core/dist/styles/base.css";
import { HashRouter as Router } from "react-router-dom";
import { AppLayout } from "@app/AppLayout/AppLayout";
import { AppRoutes } from "@app/routes";
import "@app/app.css";

const App: React.FunctionComponent = () => (
  // basename must match the name of this foundry page, as foundry always appends #<page>
  <Router basename="sandbox">
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  </Router>
);

export default App;

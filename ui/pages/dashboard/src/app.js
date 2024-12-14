import React from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";
import {
  useFalconApiContext,
  FalconApiContext,
} from "./contexts/falcon-api-context.js";
import { Home } from "./routes/home.js";
import { About } from "./routes/about.js";
import ReactDOM from "react-dom/client";
import { TabNavigation } from "./components/navigation.js";
import { SlDetails } from "@shoelace-style/shoelace/dist/react";

function Root() {
  return (
    <Routes>
      <Route
        element={
          <TabNavigation>
            <Outlet />
          </TabNavigation>
        }
      >
        <Route index path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}

function App() {
  const { falcon, navigation, isInitialized } = useFalconApiContext();

  if (!isInitialized) {
    return null;
  }

  return (
    <React.StrictMode>
      <FalconApiContext.Provider value={{ falcon, navigation, isInitialized }}>
        <h1>CrowdStrike Container Registry</h1>
        <SlDetails summary="Falcon Sensor">
          <p>
            Falcon Linux sensor as a container image, primarily to run as a
            DaemonSet in Kubernetes.
          </p>
          <p>
            <strong>Repository path</strong>
          </p>
          <p>
            <pre>
              registry.crowdstrike.com/falcon-sensor/us-2/release/falcon-sensor
            </pre>
          </p>
          <p>
            <strong>Available tags</strong>
          </p>
          <p>
            <ul>
              <li>
                <pre>6.35.0-13206.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.35.0-13207.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.37.0-13402.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.38.0-13501.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.39.0-13601.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.40.0-13706.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.40.0-13707.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.41.0-13803.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.41.0-13804.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.43.0-14006.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.44.0-14108.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.45.0-14203.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.46.0-14306.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.47.0-14408.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.48.0-14504.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.48.0-14511.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.49.0-14604.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.49.0-14611.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.50.0-14712.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.50.0-14713.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.51.0-14809.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.51.0-14810.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.51.0-14812.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.51.0-14812.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.53.0-15003.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.53.0-15003.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.54.0-15110.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.54.0-15110.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.56.0-15309.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.56.0-15309.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.57.0-15402.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.57.0-15402.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.58.0-15508.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>6.58.0-15508.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.01.0-15604.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.01.0-15604.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.02.0-15705.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.02.0-15705.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.03.0-15805.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.03.0-15805.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.04.0-15907.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.04.0-15907.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.05.0-16004-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.05.0-16004-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.06.0-16108-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.06.0-16108-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.07.0-16206-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.07.0-16206-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.10.0-16303-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.10.0-16303-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16404-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16404-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16405-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16405-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16407-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.11.0-16407-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.13.0-16604-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.13.0-16604-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.14.0-16703-1.falcon-linux.aarch64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.14.0-16703-1.falcon-linux.x86_64.Release.US-2</pre>
              </li>
              <li>
                <pre>7.15.0-16803-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.15.0-16805-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.16.0-16903-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.16.0-16907-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.17.0-17005-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.17.0-17011-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.18.0-17106-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.18.0-17129-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.19.0-17219-1.falcon-linux.Release.US-2</pre>
              </li>
              <li>
                <pre>7.20.0-17306-1.falcon-linux.Release.US-2</pre>
              </li>
            </ul>
          </p>
        </SlDetails>
      </FalconApiContext.Provider>
    </React.StrictMode>
  );
}

const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);

root.render(<App />);

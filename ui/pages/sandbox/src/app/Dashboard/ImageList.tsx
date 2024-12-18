import * as React from "react";
import { DataList, PageSection, Title } from "@patternfly/react-core";
import FalconApi from "@crowdstrike/foundry-js";
import { ImageItem } from "./ImageItem";

const ImageList: React.FunctionComponent = () => {
  const falcon = new FalconApi();

  const images = [
    {
      name: "falcon-sensor",
      description:
        "Falcon Linux sensor as a container image, to be deployed as a Kubernetes DaemonSet.",
      multiArch: true,
      registry: "registry.crowdstrike.com",
      repository: "falcon-sensor/us-2/release/falcon-sensor",
      tags: [
        "6.35.0-13206.falcon-linux.x86_64.Release.US-2",
        "6.35.0-13207.falcon-linux.x86_64.Release.US-2",
        "6.37.0-13402.falcon-linux.x86_64.Release.US-2",
        "6.38.0-13501.falcon-linux.x86_64.Release.US-2",
        "6.39.0-13601.falcon-linux.x86_64.Release.US-2",
        "6.40.0-13706.falcon-linux.x86_64.Release.US-2",
        "6.40.0-13707.falcon-linux.x86_64.Release.US-2",
        "6.41.0-13803.falcon-linux.x86_64.Release.US-2",
        "6.41.0-13804.falcon-linux.x86_64.Release.US-2",
        "6.43.0-14006.falcon-linux.x86_64.Release.US-2",
        "6.44.0-14108.falcon-linux.x86_64.Release.US-2",
        "6.45.0-14203.falcon-linux.x86_64.Release.US-2",
        "6.46.0-14306.falcon-linux.x86_64.Release.US-2",
        "6.47.0-14408.falcon-linux.x86_64.Release.US-2",
        "6.48.0-14504.falcon-linux.x86_64.Release.US-2",
        "6.48.0-14511.falcon-linux.x86_64.Release.US-2",
        "6.49.0-14604.falcon-linux.x86_64.Release.US-2",
        "6.49.0-14611.falcon-linux.x86_64.Release.US-2",
        "6.50.0-14712.falcon-linux.x86_64.Release.US-2",
        "6.50.0-14713.falcon-linux.x86_64.Release.US-2",
        "6.51.0-14809.falcon-linux.x86_64.Release.US-2",
        "6.51.0-14810.falcon-linux.x86_64.Release.US-2",
        "6.51.0-14812.falcon-linux.aarch64.Release.US-2",
        "6.51.0-14812.falcon-linux.x86_64.Release.US-2",
        "6.53.0-15003.falcon-linux.aarch64.Release.US-2",
        "6.53.0-15003.falcon-linux.x86_64.Release.US-2",
        "6.54.0-15110.falcon-linux.aarch64.Release.US-2",
        "6.54.0-15110.falcon-linux.x86_64.Release.US-2",
        "6.56.0-15309.falcon-linux.aarch64.Release.US-2",
        "6.56.0-15309.falcon-linux.x86_64.Release.US-2",
        "6.57.0-15402.falcon-linux.aarch64.Release.US-2",
        "6.57.0-15402.falcon-linux.x86_64.Release.US-2",
        "6.58.0-15508.falcon-linux.aarch64.Release.US-2",
        "6.58.0-15508.falcon-linux.x86_64.Release.US-2",
        "7.01.0-15604.falcon-linux.aarch64.Release.US-2",
        "7.01.0-15604.falcon-linux.x86_64.Release.US-2",
        "7.02.0-15705.falcon-linux.aarch64.Release.US-2",
        "7.02.0-15705.falcon-linux.x86_64.Release.US-2",
        "7.03.0-15805.falcon-linux.aarch64.Release.US-2",
        "7.03.0-15805.falcon-linux.x86_64.Release.US-2",
        "7.04.0-15907.falcon-linux.aarch64.Release.US-2",
        "7.04.0-15907.falcon-linux.x86_64.Release.US-2",
        "7.05.0-16004-1.falcon-linux.aarch64.Release.US-2",
        "7.05.0-16004-1.falcon-linux.x86_64.Release.US-2",
        "7.06.0-16108-1.falcon-linux.aarch64.Release.US-2",
        "7.06.0-16108-1.falcon-linux.x86_64.Release.US-2",
        "7.07.0-16206-1.falcon-linux.aarch64.Release.US-2",
        "7.07.0-16206-1.falcon-linux.x86_64.Release.US-2",
        "7.10.0-16303-1.falcon-linux.aarch64.Release.US-2",
        "7.10.0-16303-1.falcon-linux.x86_64.Release.US-2",
        "7.11.0-16404-1.falcon-linux.aarch64.Release.US-2",
        "7.11.0-16404-1.falcon-linux.x86_64.Release.US-2",
        "7.11.0-16405-1.falcon-linux.aarch64.Release.US-2",
        "7.11.0-16405-1.falcon-linux.x86_64.Release.US-2",
        "7.11.0-16407-1.falcon-linux.aarch64.Release.US-2",
        "7.11.0-16407-1.falcon-linux.x86_64.Release.US-2",
        "7.13.0-16604-1.falcon-linux.aarch64.Release.US-2",
        "7.13.0-16604-1.falcon-linux.x86_64.Release.US-2",
        "7.14.0-16703-1.falcon-linux.aarch64.Release.US-2",
        "7.14.0-16703-1.falcon-linux.x86_64.Release.US-2",
        "7.15.0-16803-1.falcon-linux.Release.US-2",
        "7.15.0-16805-1.falcon-linux.Release.US-2",
        "7.16.0-16903-1.falcon-linux.Release.US-2",
        "7.16.0-16907-1.falcon-linux.Release.US-2",
        "7.17.0-17005-1.falcon-linux.Release.US-2",
        "7.17.0-17011-1.falcon-linux.Release.US-2",
        "7.18.0-17106-1.falcon-linux.Release.US-2",
        "7.18.0-17129-1.falcon-linux.Release.US-2",
        "7.19.0-17219-1.falcon-linux.Release.US-2",
        "7.20.0-17306-1.falcon-linux.Release.US-2",
      ],
    },
    {
      name: "falcon-container",
      description:
        "Falcon Linux sidecar sensor, to be used when host access is not available.",
      multiArch: false,
      registry: "registry.crowdstrike.com",
      repository: "falcon-container/us-2/release/falcon-sensor",
      tags: [
        "6.35.0-1801.container.x86_64.Release.US-2",
        "6.35.0-1802.container.x86_64.Release.US-2",
        "6.35.0-1803.container.x86_64.Release.US-2",
        "6.35.0-1804.container.x86_64.Release.US-2",
        "6.36.0-1901.container.x86_64.Release.US-2",
        "6.37.0-2001.container.x86_64.Release.US-2",
        "6.38.0-2104.container.x86_64.Release.US-2",
        "6.38.0-2105.container.x86_64.Release.US-2",
        "6.41.0-2402.container.x86_64.Release.US-2",
        "6.42.0-2501.container.x86_64.Release.US-2",
        "6.42.0-2502.container.x86_64.Release.US-2",
        "6.44.0-2701.container.x86_64.Release.US-2",
        "6.46.0-2901.container.x86_64.Release.US-2",
        "6.46.0-2903.container.x86_64.Release.US-2",
        "6.47.0-3003.container.x86_64.Release.US-2",
        "6.49.0-3203.container.x86_64.Release.US-2",
        "6.50.0-3303.container.x86_64.Release.US-2",
        "6.51.0-3401.container.x86_64.Release.US-2",
        "6.53.0-3601.container.x86_64.Release.US-2",
        "6.55.0-3801.container.x86_64.Release.US-2",
        "6.56.0-3903.container.x86_64.Release.US-2",
        "6.57.0-4001.container.x86_64.Release.US-2",
        "7.02.0-4301.container.x86_64.Release.US-2",
        "7.03.0-4401.container.x86_64.Release.US-2",
        "7.04.0-4513.container.x86_64.Release.US-2",
        "7.05.0-4603.container.x86_64.Release.US-2",
        "7.06.0-4703.container.x86_64.Release.US-2",
        "7.10.0-4906.container.x86_64.Release.US-2",
        "7.11.0-5002.container.x86_64.Release.US-2",
        "7.12.0-5101.container.x86_64.Release.US-2",
        "7.13.0-5201.container.x86_64.Release.US-2",
        "7.14.0-5305.container.x86_64.Release.US-2",
        "7.15.0-5402.container.x86_64.Release.US-2",
        "7.16.0-5502.container.x86_64.Release.US-2",
        "7.17.0-5602.container.x86_64.Release.US-2",
        "7.18.0-5704.container.x86_64.Release.US-2",
        "7.19.0-5806.container.x86_64.Release.US-2",
        "7.20.0-5906.container.x86_64.Release.US-2",
      ],
    },
    {
      name: "falcon-kac",
      description:
        "Kubernetes Admission Controller (KAC) provides policy enforcement and visibility to Kubernetes posture.",
      multiArch: false,
      registry: "registry.crowdstrike.com",
      repository: "falcon-kac/us-2/release/falcon-kac",
      tags: [
        "7.01.0-103.container.x86_64.Release.US-2",
        "7.03.0-301.container.x86_64.Release.US-2",
        "7.04.0-411.container.x86_64.Release.US-2",
        "7.05.0-501.container.x86_64.Release.US-2",
        "7.06.0-601.container.x86_64.Release.US-2",
        "7.10.0-805.container.x86_64.Release.US-2",
        "7.11.0-903.container.x86_64.Release.US-2",
        "7.12.0-1001.container.x86_64.Release.US-2",
        "7.13.0-1101.container.x86_64.Release.US-2",
        "7.14.0-1202.container.x86_64.Release.US-2",
        "7.16.0-1402.container.x86_64.Release.US-2",
        "7.17.0-1502.container.x86_64.Release.US-2",
        "7.18.0-1603.container.x86_64.Release.US-2",
        "7.20.0-1807.container.x86_64.Release.US-2",
      ],
    },
    {
      name: "falcon-imageanalyzer",
      description:
        "Image Assessment at Runtime (IAR) scans container images on launch on Kubernetes, Docker, or Podman.",
      multiArch: false,
      registry: "registry.crowdstrike.com",
      repository: "falcon-imageanalyzer/us-2/release/falcon-imageanalyzer",
      tags: [
        "0.42.0",
        "1.0.0",
        "1.0.1",
        "1.0.2",
        "1.0.3",
        "1.0.8",
        "1.0.9",
        "1.0.10",
        "1.0.11",
        "1.0.12",
        "1.0.13",
        "1.0.15",
        "1.0.16",
      ],
    },
  ];

  console.log("connecting...");
  falcon
    .connect()
    .then(() => {
      console.log("connected, writing images");
      const imageCol = falcon.collection({ collection: "images" });
      images.map((i) => {
        imageCol
          .write(i.name, i)
          .then((result) => {
            console.log(result);
          })
          .catch(console.error);
      });
    })
    .catch(console.error);

  return (
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h1" size="lg">
        Container images
      </Title>
      <DataList aria-label="Mixed expandable data list example">
        {images.map((i) => {
          return <ImageItem image={i} key={i.name} />;
        })}
      </DataList>
    </PageSection>
  );
};

export { ImageList };

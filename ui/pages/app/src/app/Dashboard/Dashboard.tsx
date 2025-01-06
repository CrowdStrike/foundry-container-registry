import * as React from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { ImageList } from "./ImageList";

const Dashboard: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Title headingLevel="h1" size="lg">
      Dashboard
    </Title>
    <ImageList />
  </PageSection>
);

export { Dashboard };

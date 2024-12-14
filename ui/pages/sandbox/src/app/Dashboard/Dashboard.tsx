import * as React from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { ImageCardHolder } from "./ImageCardHolder";

const Dashboard: React.FunctionComponent = () => (
  <>
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h1" size="lg">
        Dashboard Page Title 5!
      </Title>
    </PageSection>

    <ImageCardHolder />
  </>
);

export { Dashboard };

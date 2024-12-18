import {
  DataListItem,
  DataListItemRow,
  DataListToggle,
  DataListItemCells,
  DataListCell,
  Title,
  Grid,
  GridItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  DataListContent,
  ClipboardCopy,
} from "@patternfly/react-core";
import { CubeIcon, CheckIcon, TimesIcon } from "@patternfly/react-icons";
import React from "react";

interface ImageItemProps {
  image: {
    name: string;
    description: string;
    multiArch: boolean;
    registry: string;
    repository: string;
    tags: string[];
  };
}

export function ImageItem({ image }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const latestTag = image.tags[image.tags.length - 1];
  const latestImageName = `${image.registry}/${image.repository}:${latestTag}`;

  return (
    <DataListItem isExpanded={isExpanded}>
      <DataListItemRow>
        <DataListToggle
          onClick={() => setIsExpanded(!isExpanded)}
          isExpanded={isExpanded}
          id={image.name}
        />
        <DataListItemCells
          dataListCells={[
            <DataListCell isIcon key={image.name + "-icon"}>
              <CubeIcon />
            </DataListCell>,
            <DataListCell key={image.name + "-title"}>
              <Title headingLevel="h3">{image.name}</Title>
              <p>{image.description}</p>
            </DataListCell>,
            <DataListCell key={image.name + "-info"}>
              <Grid>
                <GridItem span={9}>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Latest tag</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{latestTag}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem span={3}>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Multi-arch</DescriptionListTerm>
                      <DescriptionListDescription>
                        {image.multiArch ? (
                          <>
                            <CheckIcon /> Yes
                          </>
                        ) : (
                          <>
                            <TimesIcon /> No
                          </>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </DataListCell>,
          ]}
        />
      </DataListItemRow>
      <DataListContent aria-label="Image details" isHidden={!isExpanded}>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Latest image name</DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode={true}
              >
                {latestImageName}
              </ClipboardCopy>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Older tags</DescriptionListTerm>
            <DescriptionListDescription>
              <ul>
                {image.tags.map((t) => {
                  return (
                    <li key={image.name + "-" + t}>
                      <code>{t}</code>
                    </li>
                  );
                })}
              </ul>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </DataListContent>
    </DataListItem>
  );
}

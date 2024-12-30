import Image from "@app/shared/Image";
import {
  DataListItem,
  DataListItemRow,
  DataListToggle,
  DataListItemCells,
  DataListCell,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  DataListContent,
  ClipboardCopy,
  Label,
} from "@patternfly/react-core";
import { CubeIcon } from "@patternfly/react-icons";
import React from "react";

interface ImageItemProps {
  image: Image;
}

export function ImageItem({ image }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const latestImageName = `${image.repository}:${image.latest}`;

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
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Latest tag</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{image.latest}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
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
                    <li key={image.name + "-" + t.name}>
                      <code>{t.name}</code>
                      {t.arch.map((a) => {
                        return <Label>{a}</Label>;
                      })}
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

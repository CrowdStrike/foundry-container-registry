import Image from "@app/types/Image";
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
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";
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
              <Title
                headingLevel="h3"
                style={{ marginBottom: "var(--pf-t--global--spacer--xs)" }}
              >
                {image.name}
              </Title>
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
      <DataListContent
        aria-label="Image details"
        isHidden={!isExpanded}
        className="image-details"
      >
        <Title headingLevel="h4">Use this image</Title>
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
        </DescriptionList>
        <Title headingLevel="h4">All tags</Title>
        <Table variant="compact" borders={false} className="tags-table">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Architectures</Th>
            </Tr>
          </Thead>
          <Tbody>
            {image.tags.toReversed().map((t) => {
              return (
                <Tr>
                  <Td>
                    <code>{t.name}</code>
                  </Td>
                  <Td>
                    {t.arch.map((a) => {
                      return (
                        <>
                          {" "}
                          <Label isCompact>{a}</Label>
                        </>
                      );
                    })}
                  </Td>
                  {image.latest == t.name && (
                    <Td>
                      <Label isCompact color="blue">
                        latest
                      </Label>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </DataListContent>
    </DataListItem>
  );
}

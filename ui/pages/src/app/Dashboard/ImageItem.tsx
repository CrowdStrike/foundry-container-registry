import Image from "@app/types/Image";
import {
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Pagination,
  PaginationVariant,
  Title,
} from "@patternfly/react-core";
import { CubeIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";

interface ImageItemProps {
  image: Image;
}

export function ImageItem({ image }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  // Pagination handlers
  const onSetPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    pageNumber: number
  ) => {
    setPage(pageNumber);
  };

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  // function shortDigest(longDigest : string) {
  //   if (longDigest.length < 19) {
  //     return longDigest;
  //   } else {
  //     return shortDigest.substring(0, 19);
  //   }
  // }

  // Calculate current page items
  const reversedTags = [...image.tags].reverse();
  const start = (page - 1) * perPage;
  const end = page * perPage;
  const currentPageTags = reversedTags.slice(start, end);

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
                style={{ marginBottom: "var(--pf-global--spacer--xs)" }}
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
                <DescriptionListGroup>
                  <DescriptionListTerm>Image Path</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{image.repository}</code>
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
        <Pagination
          itemCount={image.tags.length}
          perPage={perPage}
          page={page}
          onSetPage={onSetPage}
          onPerPageSelect={onPerPageSelect}
          variant={PaginationVariant.top}
          isCompact
        />
        <Table variant="compact" borders={false} className="tags-table">
          <Thead>
            <Tr>
              <Th>Tags</Th>
              <Th style={{ minWidth: "fit-content", maxWidth: "100ch" }}>
                Architectures
              </Th>
              <Th>Digest</Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentPageTags.map((t) => (
              <Tr key={t.name}>
                <Td>
                  <code>{t.name}</code>
                </Td>
                <Td>
                  {t.arch.map((a) => (
                    <Label key={`${t.name}-${a}`} isCompact>
                      {a}
                    </Label>
                  ))}
                </Td>
                <Td>
                  <code>{t.digest}</code>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </DataListContent>
    </DataListItem>
  );
}

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
import Image from "../types/Image";

interface ImageItemProps {
  group: ImageGroup;
}

interface ImageGroup {
  name: string;
  description: string;
  multiCloud?: Image;
  regional?: Image;
}

interface ImageVariantDetailsProps {
  label: string;
  image: Image;
  showImagePath: boolean;
}

function ImageVariantDetails({ label, image, showImagePath }: ImageVariantDetailsProps) {
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

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

  const reversedTags = [...image.tags].reverse();
  const start = (page - 1) * perPage;
  const currentPageTags = reversedTags.slice(start, page * perPage);

  return (
    <section>
      <Title headingLevel="h4">{label}</Title>
      <DescriptionList className={showImagePath ? "registry-variant-info" : undefined}>
        <DescriptionListGroup>
          <DescriptionListTerm>Latest tag</DescriptionListTerm>
          <DescriptionListDescription>
            <code>{image.latest}</code>
          </DescriptionListDescription>
        </DescriptionListGroup>
        {showImagePath && (
          <DescriptionListGroup>
            <DescriptionListTerm>Image path</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{image.repository}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
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
            <Th>Tag</Th>
            <Th style={{ minWidth: "fit-content", maxWidth: "100ch" }}>
              Architectures
            </Th>
            <Th>Build date</Th>
            <Th>Digest</Th>
          </Tr>
        </Thead>
        <Tbody>
          {currentPageTags.map((tag) => (
            <Tr key={tag.name}>
              <Td>
                <code>{tag.name}</code>
              </Td>
              <Td>
                {tag.arch.map((architecture) => (
                  <React.Fragment key={`${tag.name}-${architecture}`}>
                    <Label isCompact>{architecture}</Label>{" "}
                  </React.Fragment>
                ))}
              </Td>
              <Td>
                {tag.buildDate
                  ? new Date(tag.buildDate).toLocaleString()
                  : "Not available"}
              </Td>
              <Td>
                <code>{tag.digest}</code>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </section>
  );
}

export function ImageItem({ group }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const variants = [
    group.multiCloud && { label: "Multi-cloud registry", image: group.multiCloud },
    group.regional && { label: "Cloud-specific registry", image: group.regional },
  ].filter((variant) => variant !== undefined);
  const singleImage = variants.length === 1 ? variants[0].image : undefined;

  return (
    <DataListItem isExpanded={isExpanded}>
      <DataListItemRow>
        <DataListToggle
          onClick={() => setIsExpanded(!isExpanded)}
          isExpanded={isExpanded}
          id={group.name}
        />
        <DataListItemCells
          dataListCells={[
            <DataListCell isIcon key={group.name + "-icon"}>
              <CubeIcon />
            </DataListCell>,
            <DataListCell key={group.name + "-title"}>
              <Title
                headingLevel="h3"
                style={{ marginBottom: "var(--pf-global--spacer--xs)" }}
              >
                {group.name}
              </Title>
              <p>{group.description}</p>
            </DataListCell>,
            ...(singleImage ? [
              <DataListCell key={group.name + "-info"}>
                <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Latest tag</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{singleImage.latest}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Image path</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{singleImage.repository}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
              </DataListCell>,
            ] : []),
          ]}
        />
      </DataListItemRow>
      <DataListContent
        aria-label="Image details"
        isHidden={!isExpanded}
        className="image-details"
      >
        {variants.map((variant) => (
          <ImageVariantDetails
            key={variant.image.repository}
            label={variant.label}
            image={variant.image}
            showImagePath={variants.length > 1}
          />
        ))}
      </DataListContent>
    </DataListItem>
  );
}

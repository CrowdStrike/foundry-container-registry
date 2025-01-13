import Image from "@app/types/Image";
import {
  Button,
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
  Modal,
  ModalBody,
  Pagination,
  PaginationVariant,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { CubeIcon, EyeIcon, EyeSlashIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";

interface ImageItemProps {
  image: Image;
}

export function ImageItem({ image }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<string>("");
  const [selectedDigest, setSelectedDigest] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPullToken, setShowPullToken] = React.useState(false);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
    setIsModalOpen(!isModalOpen);
  };

  const handleDownloadClick = (tagName: string, digest: string) => {
    setSelectedTag(tagName);
    setSelectedDigest(digest);
    setIsModalOpen(true);
  };

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
                  <DescriptionListTerm>Latest digest</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{image.digest}</code>
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
        {/* <Content component={ContentVariants.h3}>Registry Credentials</Content> */}
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Registry</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{image.registry}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>User</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{image.login}</code>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Password</DescriptionListTerm>
            <DescriptionListDescription>
              <code>{showPassword ? image.password : "••••••••••"}</code>
              <Button
                variant="control"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Pull Token</DescriptionListTerm>
            <DescriptionListDescription>
              <code>
                {showPullToken ? image.dockerAuthConfig : "••••••••••"}
              </code>
              <Button
                variant="control"
                onClick={() => setShowPullToken(!showPullToken)}
                aria-label={
                  showPullToken ? "Hide pull token" : "Show pull token"
                }
              >
                {showPullToken ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
        {/* <div className="pf-v5-u-my-md">
          <Divider />
        </div> */}
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
                  <code>{t.digest.substring(0, 19)}</code>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </DataListContent>
      {/* Need to Keep Modal out of the Table mapping to prevent multiple modals being created per tag */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        variant="medium"
        appendTo={document.body}
        aria-label="Pull command modal"
        style={{ minWidth: "fit-content", maxWidth: "100ch" }}
      >
        <ModalBody id="modal-box-body-custom-focus">
          <Stack hasGutter>
            <h3 style={{ fontWeight: "bold" }}>By Tag</h3>
            <StackItem>
              {/* <Title headingLevel="h4">By Tag</Title> */}
              <code>{`docker pull ${image.repository}:${selectedTag}`}</code>
            </StackItem>
            <StackItem>
              <code>{`podman pull ${image.repository}:${selectedTag}`}</code>
            </StackItem>

            <h3 style={{ fontWeight: "bold" }}>By Digest</h3>
            <StackItem>
              <code>{`docker pull ${image.repository}@${selectedDigest}`}</code>
            </StackItem>
            <StackItem>
              <code>{`podman pull ${image.repository}@${selectedDigest}`}</code>
            </StackItem>
          </Stack>
        </ModalBody>
      </Modal>
    </DataListItem>
  );
}

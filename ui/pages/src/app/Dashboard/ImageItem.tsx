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
  ActionList,
  ActionListItem,
  Button,
  Modal,
  ModalBody,
  Stack,
  StackItem,
  Pagination,
  PaginationVariant,
  Content,
  ContentVariants,
  Divider,
} from "@patternfly/react-core";
import {
  CubeIcon,
  DownloadIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@patternfly/react-icons";
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";
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
                    <ClipboardCopy
                      isReadOnly
                      hoverTip="Copy"
                      clickTip="Copied"
                      variant="inline-compact"
                      isCode={true}
                    >
                      {image.latest}
                    </ClipboardCopy>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Latest digest</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ClipboardCopy
                      isReadOnly
                      hoverTip="Copy"
                      clickTip="Copied"
                      variant="inline-compact"
                      isCode={true}
                    >
                      {image.digest}
                    </ClipboardCopy>
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
        <Content component={ContentVariants.h3}>Registry Credentials</Content>
        <DescriptionList isHorizontal isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Registry</DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {image.registry}
              </ClipboardCopy>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>User</DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {image.login}
              </ClipboardCopy>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Password</DescriptionListTerm>
            <DescriptionListDescription>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {showPassword ? image.password : "••••••••••"}
              </ClipboardCopy>
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
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {showPullToken ? image.dockerAuthConfig : "••••••••••"}
              </ClipboardCopy>
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
        <div className="pf-v5-u-my-md">
          <Divider />
        </div>
        {/* {image.tags.length > 10 && (
          <Pagination
            itemCount={image.tags.length}
            perPage={perPage}
            page={page}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
            variant={PaginationVariant.top}
            isCompact
          />
        )} */}
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
              <Th style={{ textAlign: "center" }}>Pull</Th>
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
                <Td style={{ paddingTop: 0 }}>
                  <ActionList isIconList>
                    <ActionListItem>
                      <Button
                        variant="plain"
                        id="fa-download"
                        aria-label="download icon button"
                        icon={<DownloadIcon />}
                        onClick={() => handleDownloadClick(t.name, t.digest)}
                      />
                    </ActionListItem>
                  </ActionList>
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
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {`docker pull ${image.repository}:${selectedTag}`}
              </ClipboardCopy>
            </StackItem>
            <StackItem>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {`podman pull ${image.repository}:${selectedTag}`}
              </ClipboardCopy>
            </StackItem>

            <h3 style={{ fontWeight: "bold" }}>By Digest</h3>
            <StackItem>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {`docker pull ${image.repository}@${selectedDigest}`}
              </ClipboardCopy>
            </StackItem>
            <StackItem>
              <ClipboardCopy
                isReadOnly
                hoverTip="Copy"
                clickTip="Copied"
                variant="inline-compact"
                isCode
              >
                {`podman pull ${image.repository}@${selectedDigest}`}
              </ClipboardCopy>
            </StackItem>
          </Stack>
        </ModalBody>
      </Modal>
    </DataListItem>
  );
}

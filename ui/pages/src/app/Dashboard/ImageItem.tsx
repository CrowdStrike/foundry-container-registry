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
} from "@patternfly/react-core";
import { CubeIcon, DownloadIcon } from "@patternfly/react-icons";
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";
import React from "react";

interface ImageItemProps {
  image: Image;
}

export function ImageItem({ image }: ImageItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTag, setSelectedTag] = React.useState<string>("");

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
    setIsModalOpen(!isModalOpen);
  };

  const handleDownloadClick = (tagName: string) => {
    setSelectedTag(tagName);
    setIsModalOpen(true);
  };

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
        <Table variant="compact" borders={false} className="tags-table">
          <Thead>
            <Tr>
              <Th>Tags</Th>
              <Th style={{ width: "50%" }}>Architectures</Th>
            </Tr>
          </Thead>
          <Tbody>
            {image.tags.toReversed().map((t) => (
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
                  <ActionList isIconList>
                    <ActionListItem>
                      <Button
                        variant="plain"
                        id="fa-download"
                        aria-label="download icon button"
                        icon={<DownloadIcon />}
                        onClick={() => handleDownloadClick(t.name)}
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
            <StackItem>
              <Title headingLevel="h4">Docker</Title>
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
              <Title headingLevel="h4">Podman</Title>
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
          </Stack>
        </ModalBody>
      </Modal>
    </DataListItem>
  );
}

import { IAppRoute, IAppRouteGroup, routes } from "@app/routes";
import {
  Button,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  Page,
  PageSidebar,
  PageSidebarBody,
  SkipToContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import FalconApi from "@crowdstrike/foundry-js";

interface IAppLayout {
  children: React.ReactNode;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const falcon = new FalconApi();
  try {
    // (workaround) must connect to falcon in order to show iframe
    falcon.connect();
  } catch (error) {
    console.error(error);
  }

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadBrand style={{ margin: "auto" }}>
          <Title headingLevel="h2">Container Registry</Title>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem align={{ default: "alignEnd" }}>
              {/* <Button variant="secondary" isDisabled>
                Copy login command
              </Button> */}
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const location = useLocation();

  const renderNavItem = (route: IAppRoute, index: number) => (
    <NavItem
      key={`${route.label}-${index}`}
      id={`${route.label}-${index}`}
      isActive={route.path === location.pathname}
    >
      <NavLink to={route.path}>{route.label}</NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: IAppRouteGroup, groupIndex: number) => (
    <NavExpandable
      key={`${group.label}-${groupIndex}`}
      id={`${group.label}-${groupIndex}`}
      title={group.label}
      isActive={group.routes.some((route) => route.path === location.pathname)}
    >
      {group.routes.map(
        (route, idx) => route.label && renderNavItem(route, idx)
      )}
    </NavExpandable>
  );

  const Navigation = (
    <Nav id="nav-primary-simple">
      <NavList id="nav-list-simple">
        {routes.map(
          (route, idx) =>
            route.label &&
            (!route.routes
              ? renderNavItem(route, idx)
              : renderNavGroup(route, idx))
        )}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = "primary-app-container";

  const PageSkipToContent = (
    <SkipToContent
      onClick={(event) => {
        event.preventDefault();
        const primaryContentContainer = document.getElementById(pageId);
        primaryContentContainer?.focus();
      }}
      href={`#${pageId}`}
    >
      Skip to Content
    </SkipToContent>
  );
  return (
    <Page
      mainContainerId={pageId}
      masthead={masthead}
      sidebar={Sidebar}
      skipToContent={PageSkipToContent}
    >
      {children}
    </Page>
  );
};

export { AppLayout };

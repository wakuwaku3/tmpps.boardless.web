import { StyledComponentBase } from 'src/infrastructures/styles/types';
import { createStyles, Typography, IconButton } from '@material-ui/core';
import * as React from 'react';
import { EventMapper } from 'src/infrastructures/stores/types';
import { Resources } from 'src/domains/common/location/resources';
import { decorate } from 'src/infrastructures/styles/styles-helper';
import { withConnectedRouter } from 'src/infrastructures/routing/routing-helper';
import { History } from 'history';
import { Workspace } from 'src/domains/models/accounts/workspace';
import { Claim } from 'src/domains/models/accounts/claim';
import { AccountsSelectors } from 'src/infrastructures/stores/accounts/selectors';
import {
  OutlinedButton,
  Button,
} from 'src/web/components/forms-controls/button';
import { Container } from 'src/web/components/layout/container';
import { Row } from 'src/web/components/layout/row';
import { resolve } from 'src/use-cases/common/di-container';
import { Cell } from 'src/web/components/layout/cell';
import { WorkspaceIcon } from './workspace-icon';
import { InfinityLoading } from 'src/web/components/extensions/infinity-loading';
import { ContextMenu } from 'src/web/components/extensions/context-menu';
import { Autocomplete } from 'src/web/components/forms-controls/autocomplete';
import { delay } from 'src/infrastructures/common/async-helper';
import { Url } from 'src/infrastructures/routing/url';
import { parse } from 'query-string';
import { Search } from '@material-ui/icons';
import { StateMapperWithRouter } from 'src/infrastructures/routing/types';
import { StoredState } from 'src/infrastructures/stores/stored-state';
import { symbols } from 'src/use-cases/common/di-symbols';

const suggestions = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'American Samoa',
  'Andorra',
  'Angola',
  'Anguilla',
  'Antarctica',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bermuda',
  'Bhutan',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'British Indian Ocean Territory',
];
const styles = createStyles({
  root: {
    padding: 10,
    overflowX: 'auto',
  },
  container: {},
  actionButtonRow: {
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 25,
  },
  autocomplete: { paddingLeft: 16 },
  autocompleteContainer: { width: `calc(100% - ${56}px)` },
  searchButtonContainer: { marginLeft: 'auto', top: -4 },
  infinity: {},
});
interface Props {
  claims: { [index: string]: Claim };
  resources: Resources;
  history: History;
  joinableWorkspaces: { [index: string]: Workspace };
  fetchCount: number;
  searchKeyword?: string;
}
interface Params {
  workspaceUrl: string;
}
const mapStateToProps: StateMapperWithRouter<StoredState, Props, Params> = (
  { accounts, workspaces },
  { history, location },
) => {
  const { claims } = accounts;
  const { joinableWorkspaces } = workspaces;
  const { resources } = new AccountsSelectors(accounts);
  const { searchKeyword } = parse(location.search);
  return {
    claims,
    resources,
    history,
    joinableWorkspaces,
    searchKeyword: searchKeyword ? searchKeyword.toString() : undefined,
    fetchCount: 50,
  };
};
interface Events {
  getJoinableWorkspaces: (
    searchKeyword: string | undefined,
    clear: boolean,
    count: number,
    fetchCount: number,
  ) => Promise<boolean>;
  join: (workspace: Workspace, claim: Claim, history: History) => void;
}
const mapEventToProps: EventMapper<Events> = () => {
  const { getJoinableWorkspaces, join } = resolve(symbols.workspaceUseCase);
  return {
    getJoinableWorkspaces,
    join: (workspace, claim, history) => {
      join(workspace, claim);
      history.push(Url.workspaceRoot(workspace.workspaceUrl));
    },
  };
};
interface State {
  searchKeyword?: string;
  loadCompleted: boolean;
  scrollContainer: HTMLDivElement | null;
  trigger?: (init: boolean) => Promise<void>;
  openJoinContextMenu?: { targetWorkspace: Workspace; anchorEl: HTMLElement };
}
class Inner extends StyledComponentBase<typeof styles, Props & Events, State> {
  constructor(props: any) {
    super(props);
    const { searchKeyword } = this.props;
    this.state = {
      searchKeyword,
      loadCompleted: false,
      scrollContainer: null,
    };
  }
  private nextWorkspacesAsync = async (init: boolean) => {
    const {
      getJoinableWorkspaces,
      fetchCount,
      joinableWorkspaces,
    } = this.props;
    const { searchKeyword, loadCompleted } = this.state;
    const joinableWorkspacesArray = Object.entries(joinableWorkspaces);
    const completed = await getJoinableWorkspaces(
      searchKeyword,
      init,
      init ? 0 : joinableWorkspacesArray.length,
      fetchCount,
    );
    if (completed || (init && !completed && loadCompleted)) {
      this.setState({ loadCompleted: completed });
    }
  };
  private search = async () => {
    const { history } = this.props;
    const { searchKeyword, trigger } = this.state;
    if (this.props.searchKeyword !== searchKeyword) {
      history.push(Url.searchWorkspaces(searchKeyword));
      if (trigger) {
        await trigger(true);
      }
    }
  };
  private changeSearchKeyword(searchKeyword: string) {
    this.setState({ searchKeyword });
  }
  private handleClose = () => {
    this.setState({
      openJoinContextMenu: undefined,
    });
  };
  private clickJoin = (workspace: Workspace) => (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    const { claims, join, history } = this.props;
    const claimsArray = Object.entries(claims);
    if (claimsArray.length === 0) {
      join(workspace, claimsArray[0][1], history);
    } else if (claimsArray.length > 1) {
      this.setState({
        openJoinContextMenu: {
          targetWorkspace: workspace,
          anchorEl: event.currentTarget,
        },
      });
    }
  };
  private setScrollContainer = (scrollContainer: HTMLDivElement | null) => {
    this.setState({ scrollContainer });
  };
  private getSuggestionsAsync = async (value: string) => {
    await delay(100);
    return suggestions.filter(x => x.indexOf(value) > -1).slice(0, 5);
  };
  public render() {
    const {
      classes,
      resources,
      joinableWorkspaces,
      claims,
      join,
      history,
    } = this.props;
    const {
      searchKeyword,
      loadCompleted,
      openJoinContextMenu,
      scrollContainer,
    } = this.state;
    const {
      root,
      container,
      actionButtonRow,
      infinity,
      autocomplete,
      autocompleteContainer,
      searchButtonContainer,
    } = classes;
    const claimsArray = Object.entries(claims);
    const joinableWorkspacesArray = Object.entries(joinableWorkspaces);
    return (
      <div className={root} ref={this.setScrollContainer}>
        <Container className={container}>
          <Row>
            <Typography variant="h4">{resources.JoinWorkspace}</Typography>
          </Row>
          <Row className={actionButtonRow}>
            <div className={autocompleteContainer}>
              <Autocomplete
                textBoxProps={{ color: 'primary' }}
                value={searchKeyword}
                onChange={v => this.changeSearchKeyword(v)}
                getSuggestionsAsync={this.getSuggestionsAsync}
                injectClasses={{ popper: autocomplete }}
              />
            </div>
            <div className={searchButtonContainer}>
              <IconButton onClick={this.search}>
                <Search fontSize="small" />
              </IconButton>
            </div>
          </Row>
          <Row>
            <Typography variant="h6">{resources.JoinableWorkspace}</Typography>
          </Row>
          <InfinityLoading
            loadCompleted={loadCompleted}
            next={this.nextWorkspacesAsync}
            className={infinity}
            anchorElm={scrollContainer}
            getExternalTrigger={trigger => this.setState({ trigger })}
          >
            {joinableWorkspacesArray.map(x => {
              const w = x[1];
              const { workspaceUrl, name } = w;
              return (
                <Row key={workspaceUrl}>
                  <Cell xs={4}>
                    <WorkspaceIcon workspace={w} />
                  </Cell>
                  <Cell xs={4}>
                    <Typography>{name}</Typography>
                  </Cell>
                  <Cell xs={4}>
                    <OutlinedButton onClick={this.clickJoin(w)}>
                      {resources.Join}
                    </OutlinedButton>
                  </Cell>
                </Row>
              );
            })}
          </InfinityLoading>
          {claimsArray.length > 0 && (
            <ContextMenu
              open={Boolean(openJoinContextMenu)}
              anchorEl={openJoinContextMenu && openJoinContextMenu.anchorEl}
              onClose={this.handleClose}
            >
              {claimsArray.map(c => {
                const claim = c[1];
                return (
                  <Button
                    key={claim.userId}
                    onClick={() => {
                      if (openJoinContextMenu) {
                        join(
                          openJoinContextMenu.targetWorkspace,
                          claim,
                          history,
                        );
                      }
                      this.handleClose();
                    }}
                  >
                    {resources.JoinAs(claim.name)}
                  </Button>
                );
              })}
            </ContextMenu>
          )}
        </Container>
      </div>
    );
  }
}
const StyledInner = decorate(styles)(Inner);
export const WorkspaceSearch = withConnectedRouter(
  mapStateToProps,
  mapEventToProps,
)(StyledInner);

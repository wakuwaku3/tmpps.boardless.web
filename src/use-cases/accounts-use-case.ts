import { SignInModel } from 'src/domains/models/accounts/sign-in-model';
import { injectable } from 'inversify';
import { SignInResult } from 'src/domains/models/accounts/sign-in-result';
import { Claim } from 'src/domains/models/accounts/claim';
import { History } from 'history';
import { IAccountsUseCase } from 'src/use-cases/interfaces/accounts-use-case';
import { IFetchService } from 'src/use-cases/services/interfaces/fetch-service';
import { IMessagesUseCase } from 'src/use-cases/interfaces/messages-service';
import { IDispatchProvider } from 'src/use-cases/services/interfaces/dispatch-provider';
import { ApiUrl, Url } from 'src/infrastructures/routing/url';
import { inject } from 'src/infrastructures/services/inversify-helper';
import { signIn } from 'src/infrastructures/stores/accounts/action-creators';
import { symbols } from 'src/use-cases/common/di-symbols';

@injectable()
export class AccountsUseCase implements IAccountsUseCase {
  constructor(
    @inject(symbols.fetchService) private fetchService: IFetchService,
    @inject(symbols.messagesUseCase) private messagesService: IMessagesUseCase,
    @inject(symbols.dispatchProvider)
    private dispatchProvider: IDispatchProvider,
  ) {}
  private get dispatch() {
    return this.dispatchProvider.dispatch;
  }
  public refreshTokenAsync = async (claim?: Claim) => {
    if (!claim) {
      return;
    }
    const result = await this.fetchService.fetchAsync<SignInResult>({
      url: ApiUrl.accountsRefresh,
      methodName: 'POST',
      body: claim,
    });
    this.dispatch(signIn({ result }));
  };
  public validate = (model: SignInModel) => {
    const { email, password } = model;
    let hasError = false;
    this.messagesService.clear();
    if (!email) {
      this.messagesService.appendMessages(({ messages, resources }) => ({
        level: 'warning' as 'warning',
        text: messages.requiredError(resources.Email),
      }));
      hasError = true;
    }
    if (!password) {
      this.messagesService.appendMessages(({ messages, resources }) => ({
        level: 'warning' as 'warning',
        text: messages.requiredError(resources.Password),
      }));
      hasError = true;
    }
    return !hasError;
  };
  public signInAsync = async (
    model: SignInModel,
    history: History,
    workspaceUrl?: string,
  ) => {
    const { errors, result } = await this.fetchService.fetchAsync<{
      result: SignInResult;
      errors: string[];
    }>({
      url: ApiUrl.accountsSignIn,
      methodName: 'POST',
      body: model,
    });
    if (errors && errors.length > 0) {
      this.messagesService.appendMessages(
        ...errors.map(error => () => ({
          level: 'error' as 'error',
          text: error,
        })),
      );
      return;
    }
    this.dispatch(signIn({ result }));
    if (result.claim) {
      const { name } = result.claim;
      this.messagesService.appendMessages(({ messages }) => ({
        level: 'info' as 'info',
        text: messages.signIn(name),
        showDuration: 5000,
      }));
    }
    if (workspaceUrl) {
      history.push(Url.workspaceRoot(workspaceUrl));
      return;
    } else if (result.workspaces && result.workspaces.length > 0) {
      history.push(Url.workspaceRoot(result.workspaces[0].workspaceUrl));
      return;
    }
    history.push(Url.root);
  };
}
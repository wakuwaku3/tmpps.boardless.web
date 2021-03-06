import { createRegisterSymbol } from 'src/infrastructures/services/inversify-helper';
import { IWorkspaceUseCase } from '../interfaces/workspace-use-case';
import { IAccountsUseCase } from '../interfaces/accounts-use-case';
import { IMessagesUseCase } from '../interfaces/messages-use-case';
import { ISideMenuUseCase } from '../interfaces/side-menu-use-case';

export const useCaseSymbols = {
  workspaceUseCase: createRegisterSymbol<IWorkspaceUseCase>(),
  accountsUseCase: createRegisterSymbol<IAccountsUseCase>(),
  messagesUseCase: createRegisterSymbol<IMessagesUseCase>(),
  sideMenuUseCase: createRegisterSymbol<ISideMenuUseCase>(),
};

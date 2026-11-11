import { useCallback, useState } from 'react';
import { VoidFunc } from '../@Types';
export type ActionCallback = (...args: any[]) => Promise<any>;
export type Action = {
  callback: ActionCallback;
  onCall: VoidFunc | undefined;
  onDone: VoidFunc | undefined;
};
export const useActionHandler = () => {
  const [isCalling, setCalling] = useState<boolean>(false);
  const [actions, setActions] = useState<Map<string, Action>>(new Map());
  const registerAction = useCallback((actionName: string, callback: ActionCallback, onCall?: VoidFunc, onDone?: VoidFunc): void => {
    const action: Action = { callback, onCall, onDone };
    setActions((prev) => new Map(prev).set(actionName, action));
  }, []);
  const unregisterAction = useCallback((actionName: string): void => {
    setActions((prev) => {
      const newActions = new Map(prev);
      newActions.delete(actionName);
      return newActions;
    });
  }, []);
  const invokeAction = useCallback(
    async (actionName: string, ...args: any[]): Promise<any> => {
      const action = actions.get(actionName);
      if (!action) return Promise.reject(`Action "${actionName}" not registered.`);
      setCalling(true);
      action.onCall?.();
      try {
        const result = await action.callback(...args);
        action.onDone?.();
        return result;
      } catch (error) {
        action.onDone?.();
        throw error;
      } finally {
        setCalling(false);
      }
    },
    [actions]
  );
  return { isCalling, registerAction, invokeAction, unregisterAction };
};

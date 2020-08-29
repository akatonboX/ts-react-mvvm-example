import React from "react";
import styles from "./messageBox.module.scss";
import classNames from "classnames";
import { useBindingSource, useBindingReceiver } from 'ts-react-mvvm';
import { $path } from 'ts-react-mvvm';
import { SourceManager, BindingSource } from 'ts-react-mvvm';
import { EventManager, ValueChangedEventArgs } from 'ts-react-mvvm';
import { $bindingPath } from 'ts-react-mvvm';

export enum MessageBoxType{
  Ok = "Ok",
  OkCancel="OkCancel",
  YesNo = "YesNo",
}

export enum MessageBoxResult{
  Ok = "Ok",
  Cancel="Cancel",
  Yes = "Yes",
  No = "No",
}

const messageBoxSourceKey = Symbol("messageBoxSourceKey");

interface MessageBoxSource{
  isVisible: boolean;
  message: string;
  messageBoxType: MessageBoxType;
  messageBoxResult?: MessageBoxResult;
}

export const MessageBox = function(
  props: {

  }
) 
{
  useBindingSource<MessageBoxSource>(messageBoxSourceKey, {
    isVisible: false,
    message: "",
    messageBoxType: MessageBoxType.OkCancel,
  });
  const receiver = useBindingReceiver();

  const onOkClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    
    const sourceProxy = SourceManager.get(messageBoxSourceKey).createSourceProxy<MessageBoxSource>();
    sourceProxy.data.messageBoxResult = MessageBoxResult.Ok;
    sourceProxy.data.isVisible = false;
  };
  const onCancelClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const sourceProxy = SourceManager.get(messageBoxSourceKey).createSourceProxy<MessageBoxSource>();
    sourceProxy.data.messageBoxResult = MessageBoxResult.Cancel;
    sourceProxy.data.isVisible = false;
  };
  const onYesClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const sourceProxy = SourceManager.get(messageBoxSourceKey).createSourceProxy<MessageBoxSource>();
    sourceProxy.data.messageBoxResult = MessageBoxResult.Yes;
    sourceProxy.data.isVisible = false;
  };
  const onNoClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const sourceProxy = SourceManager.get(messageBoxSourceKey).createSourceProxy<MessageBoxSource>();
    sourceProxy.data.messageBoxResult = MessageBoxResult.No;
    sourceProxy.data.isVisible = false;
  };

  const proxy = receiver.createBindingProxy<MessageBoxSource>($bindingPath(messageBoxSourceKey));
  const commandAreaContent = (()=>{
    switch(proxy.messageBoxType.$get(MessageBoxType.Ok)){
      case MessageBoxType.OkCancel:
        return (
          <ul>
            <li>
              <button onClick={onOkClick} >OK</button>
            </li>
            <li>
              <button  onClick={onCancelClick}>Cnacel</button>
            </li>
          </ul>
        );
      case MessageBoxType.YesNo:
        return (
          <ul>
            <li>
              <button onClick={onYesClick} >Yes</button>
            </li>
            <li>
              <button onClick={onNoClick}>No</button>
            </li>
          </ul>
        );
      default:
        return(
          <ul>
            <li>
              <button onClick={onOkClick} >OK</button>
            </li>
          </ul>
        );
    }
  })();
    
  return (
    <>
      {
        proxy.isVisible.$get(false) ?
          <div className={styles.modalPanel}>
            <div className={styles.dialog}>
              <div className={styles.content}>
                <dl>
                  <dt>{proxy.message.$value}</dt>
                </dl>
              </div>
              <div className={styles.commandContainer}>
                {commandAreaContent}
              </div>
            </div>
          </div>
        : <></>
      }
    </>
  );
};


export function showMessageBox(message: string, messageBoxType: MessageBoxType): Promise<MessageBoxResult>{
  
  return new Promise<MessageBoxResult>(
    resolve => {
      const bindingSource = SourceManager.get(messageBoxSourceKey);
      if(bindingSource === undefined)
        throw Error("showMessageBox: Missing MessageBox tag.");
      const onValueChanged = async (sender: BindingSource, args: ValueChangedEventArgs) => {
        if(sender.sourceKey === messageBoxSourceKey && bindingSource.getValue($path<MessageBoxSource>().isVisible) === false){
          EventManager.valueChanged.remove(onValueChanged);
          resolve(bindingSource.getValue($path<MessageBoxSource>().messageBoxResult));
        }
      };
      
      EventManager.valueChanged.add(onValueChanged);

      bindingSource.setValue($path<MessageBoxSource>(),{
        isVisible: true,
        message: message,
        messageBoxType: messageBoxType,
      });
    }
  )
}


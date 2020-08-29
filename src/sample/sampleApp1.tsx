import React from 'react';
import { $path, $bindingPath, $bind, $mbind, SourceManager, CollectionSourceItem, BindSource, Bind, BindInput, BindTextBox, BindRadioButton, InputError, BindList, BindSelectButton, BindCollectionSource, InputSource, BindCheckBox, BindMultiSelectButton, BindTextArea } from 'ts-react-mvvm';
import { User, UserGroup, Sex} from "./model";
import { axios } from "./axios";
import { MessageBox, MessageBoxType, showMessageBox, MessageBoxResult } from "./components/messageBox";
import styles from "./sample.module.scss";

enum EditMode{
  update,
  create,
}
interface ViewModel{
  users?: User[];
  groups?: UserGroup[];
  editMode: EditMode;
  userList: {
    selectedUser?: User;
    isLoading: boolean;
    maxPage: number;
  }
}

const VIEW_MODEL = $bindingPath<ViewModel>(Symbol("viewModel"));
const userListItemsKey = Symbol("userListItems");
const USER_DETAIL = $bindingPath<User>(Symbol("userDetail"));


export function SampleApp1(
  props: {
  }
) {
  const createUser = () => {
    const viewModel = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy<ViewModel>();
    if(viewModel.data.editMode !== EditMode.create){
      viewModel.data.userList.selectedUser = undefined;
      viewModel.data.editMode = EditMode.create;
    }
  }
  const deleteUser = async (userId : number | undefined) => {
    if(userId !== undefined){
      const messageBoxResult = await showMessageBox("Can I delete it?", MessageBoxType.YesNo);
      if(messageBoxResult === MessageBoxResult.Yes){
        const viewModel = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy<ViewModel>();
        viewModel.data.userList.selectedUser = undefined;
        viewModel.data.users = viewModel.data.users === undefined ? [] :  viewModel.data.users.filter(item => item.id !== userId);
      }
    }
  }

  const saveUser = async () => {
    const userDetailSource = SourceManager.get(USER_DETAIL.$sourceKey);
    userDetailSource.validate();
    if(userDetailSource.hasError){
      await showMessageBox("input errors.", MessageBoxType.Ok);
      return;
    }
    if(!userDetailSource.hasChange){
      await showMessageBox("no change.", MessageBoxType.Ok);
      return;
    }
   
    const viewModelProxy = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy<ViewModel>();
    if(viewModelProxy.data.users !== undefined){
      const index = viewModelProxy.data.users.findIndex(user => user.id === userDetailSource.getValue($path<User>().id));
      userDetailSource.commit();
      viewModelProxy.data.users[index] = userDetailSource.source;
    }
  }

  const reset = async () => {
    const userDetailSource = SourceManager.get(USER_DETAIL.$sourceKey);
    userDetailSource.reset();
  }
  const addUser = async () => {
    const userDetailSource = SourceManager.get(USER_DETAIL.$sourceKey);
    if(userDetailSource.hasError){
      await showMessageBox("input errors.", MessageBoxType.Ok);
      return;
    }
   
    
  }
  const cancel = async () => {
    const userDetailSource = SourceManager.get(USER_DETAIL.$sourceKey);
    if(userDetailSource.hasChange){
      if(await showMessageBox("Would you like to cancel?", MessageBoxType.YesNo) === MessageBoxResult.No){
        return;
      };
    }
    const viewModel = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy<ViewModel>();
    viewModel.data.editMode = EditMode.update;
  }

  return (
    <>
      <BindSource sourceKey={VIEW_MODEL.$sourceKey} initialValue={{
        editMode: EditMode.update,
        userList: {
          isLoading: true,
          maxPage: 0,
        }
      } as ViewModel} 
        onInitialized={
          (source) => {
            axios.get("api/users").then(
              response => {
                source.data.users = response.data;
                source.data.userList.isLoading = false;  
              }
            );
            axios.get("api/groups").then(
              response => {
                source.data.groups = response.data;
              }
            );
          }
        }
        onValueChanged={
          (proxy, changes) => {
            const selectedUserChanged = changes.find(item => item.path.$equals($path<ViewModel>().userList.selectedUser));
            if(selectedUserChanged !== undefined && selectedUserChanged.newValue !== undefined){
              proxy.data.editMode = EditMode.update;
            }
          }
        }
      />

      <BindSource sourceKey={USER_DETAIL.$sourceKey} 
        initialValue={
          $mbind(
            {
              selectedUser: VIEW_MODEL.userList.selectedUser.$asBinding(),
              editMode: VIEW_MODEL.editMode.$asBinding(),
            },
            bindings => {
              if(bindings.editMode === EditMode.create){
                return {
                  id: -1,
                  name: "",
                  code: "",
                  mailAddress: "",
                  birthday: undefined,
                  phone: "",
                  isMember: true,
                  isEnable: true,
                  groups: [],
                } as User;
              }
              else{
                return bindings.selectedUser;
              }
            }
          )
        }      
      />
      <Bind bindings={{filterText: $bind($bindingPath<InputSource<string>>("filterTextBox").value)}} >
        {
          values => 
            <BindCollectionSource 
              sourceKey={userListItemsKey}
              source={VIEW_MODEL.users.$asBinding()}
              groupings={
                [
                  item => item.name.length >= 0 ? item.name.substr(0, 1) : "",
                  item => item.name.length >= 1 ? item.name.substr(1, 1) : "",
                ]
              }
              filter={item => {
                const filterText = values.filterText;
                if(filterText !== undefined && filterText.trim().length > 0){
                  return item.name.startsWith(filterText);
                }
                else{
                  return true;
                }
              }}
              getSortKey={item => item.name}
              deps={[values.filterText]}
            />
        }
      </Bind>
      <MessageBox />
      <div className={styles.container}>
      
        <div style={{gridRow: "1 / 2", gridColumn: "1 / 2"}}>
        WWWWWWWW<br/>
       
        <button onClick={event=>{createUser()}}>new</button> 
        <Bind 
          bindings={{
            selectedUser: VIEW_MODEL.userList.selectedUser.$asBinding(),
          }}
          children={values => {
            return (
              values.selectedUser === undefined 
                ? <button disabled={true}>delete</button> 
                : <button onClick={event=>{deleteUser(values.selectedUser?.id)}}>delete</button>
            );
          }}
            
        />
        <br/>
        </div>
        <div style={{gridRow: "2 / 3", gridColumn: "1 / 2"}}>
            <BindTextBox name="filterTextBox"  />
            <BindList 
              items={$bind($bindingPath<CollectionSourceItem<User>[]>(userListItemsKey))} 
              template = {
                props => {
                  const onScroll = (event: React.UIEvent<HTMLUListElement, UIEvent>) => {
                    if(event.currentTarget.scrollHeight - 50 < event.currentTarget.scrollTop + event.currentTarget.clientHeight ){
                      const userList = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy(VIEW_MODEL.$path.userList);
                      if(!userList.data.isLoading){
                        userList.data.isLoading = true;
                        axios.get(`api/users?page=${userList.data.maxPage + 1}`).then(
                          response => {
                            const viewModel = SourceManager.get(VIEW_MODEL.$sourceKey).createSourceProxy<ViewModel>();
                            viewModel.data.users = [...(viewModel.data.users === undefined ? [] : viewModel.data.users), ...response.data];
                            userList.data.isLoading = false;  
                            userList.data.maxPage += 1;

                          }
                        );
                      }
                    }
                
                  };
                  return <ul style={{height: 400, overflowY: "scroll"}} onScroll={onScroll}><props.content /></ul>;
                }
              } 
              itemTemplate = {
                props => (
                  <>
                    {
                      props.item.isGroupHeaders[0] 
                      ? <li style={{backgroundColor: "#CCFFFF"}}>{props.item.groups[0]}</li>
                      : <></>
                    }
                    {
                      props.item.isGroupHeaders[1] 
                      ? <li style={{backgroundColor: "#CCFFFF", fontSize: "50%"}}>{props.item.groups[0]}{props.item.groups[1]}</li>
                      : <></>
                    }
                    {
                      props.item.isVisible ?
                        <li>
                          <BindSelectButton
                            source={VIEW_MODEL.userList.selectedUser}
                            targetValue={props.item.item}
                            equals={(target, value) => target?.id === value?.id}
                          >
                            {
                              childProps => {
                                return (
                                  <div 
                                    onClick={async (e) => {
                                      if(SourceManager.get(USER_DETAIL.$sourceKey).hasChange){
                                        if(await showMessageBox("Do you want to discard the edits", MessageBoxType.YesNo) === MessageBoxResult.Yes){
                                          childProps.onInputChange(!childProps.inputValue);
                                        };
                                      }
                                      else{
                                        childProps.onInputChange(!childProps.inputValue);
                                      }
                                    }}  
                                    style={{color: childProps.inputValue ? "red" : "black"}}>
                                    {props.item.item.name}({props.item.item.id})
                                  </div>
                                );
                              }
                            }
                          </BindSelectButton>
                        </li>
                      : <></>
                    }
                    
                  </>
                )
              }
            />
        </div>
        <div style={{gridRow: "1 / 3", gridColumn: "2 / 3"}}>
          <Bind 
            bindings={
              {
                selectedUser: VIEW_MODEL.userList.selectedUser.$asBinding(),
                editMode: VIEW_MODEL.editMode.$asBinding()
              }
            }>{
              values => values.editMode === EditMode.update && values.selectedUser === undefined ?
                <div style={{fontSize: "20pt"}}>{"<<"}select user</div>
                :<>
                  <span>■</span>
                  
                  <ul className={styles.detail}>
                    <li>
                      <label>name</label>
                      <span className={styles.body}>
                        <Bind 
                          bindings={
                            {
                              user: USER_DETAIL.name.$asBinding(),
                            }
                          } 
                        />
                      </span>
                    </li>
                    <li>
                      <label><InputError target={USER_DETAIL.name} />name</label>
                      <BindTextBox className={styles.body} source={USER_DETAIL.name} convertInputValue={input => input.substr(0, 1000)} 
                        validates={[
                          (input, proxy) => input.length === 0 ? "Required" : null,
                        ]}
                      />
                    </li>
                    <li>
                      <label>type</label>
                      <div className={styles.body}>
                        <BindCheckBox source={USER_DETAIL.isMember} isReverse={true}  id="isMember"/>
                        <label htmlFor="isMember">guest</label>

                      </div>
                    </li>
                    <li>
                      <label><InputError target={USER_DETAIL.code} />code</label>
                      <Bind bindings={{isMember: USER_DETAIL.isMember.$asBinding()}} >
                        {
                          values => (
                            <BindTextBox className={styles.body} source={USER_DETAIL.code} convertInputValue={input => input.toUpperCase() } isEnable={values.isMember}
                              validates={[
                                (input, proxy) => input.length === 0 ? "Required" : null,
                                (input, proxy) => !/^[a-zA-Z]*$/.test(input) ? "alphabet only" : null,
                              ]}
                            />
                          )
                        }
                      </Bind>
                    </li>
                    
                    <li>
                      <label><InputError target={USER_DETAIL.sex} />sex</label>
                      <div className={styles.body}>
                        <BindRadioButton source={USER_DETAIL.sex} targetValue={Sex.male} id="male"  />
                        <label htmlFor="male">male</label>
                        <BindRadioButton source={USER_DETAIL.sex} targetValue={Sex.female} id="female" />
                        <label htmlFor="female">female</label>
                        <BindRadioButton source={USER_DETAIL.sex} targetValue={undefined} id="unknown" 
                          validates={[
                            (input, proxy) => proxy.getRoot<User>().data.isMember && input ? {message: "Required", allowSet: true }: null,
                          ]} 
                          dependencePaths={[USER_DETAIL.sex, USER_DETAIL.isMember]}/>
                        <label htmlFor="unknown">unknown</label>
                      </div>
                    </li>
                    <li>
                      <label><InputError target={USER_DETAIL.age} />age</label>
                      <BindTextBox className={styles.body} source={USER_DETAIL.age} convertInputValue={input => input.replace(/[^0-9]/g, "")} 
                        validates={[
                          (input, proxy) => /^[0-9]*$/.test(input) ? null : "number only",
                          (input, proxy) => proxy.getRoot<User>().data.isMember && input.length === 0 ? "Required" : null,
                        ]}
                        dependencePaths ={[
                          USER_DETAIL.isMember
                        ]}

                      />
                    </li>
                    <li>
                      <label><InputError target={USER_DETAIL.groups} />group</label>
                      <BindList items={VIEW_MODEL.groups.$asBinding()} 
                        template={childProps => (<ul style={{display: "flex"}}><childProps.content /></ul>)}
                        itemTemplate={childProps => (
                          <li style={{listStyle: "none"}}> 
                            <BindMultiSelectButton 
                              source={USER_DETAIL.groups}
                              targetValue={childProps.item}
                              equals={(value1, value2) => value1.name === value2.name}
                            >
                              {
                                inputProps => (
                                  <Bind bindings={{isGuest: USER_DETAIL.isMember.$asBinding(isMember => isMember === undefined ? true : !isMember)}} >
                                    {
                                      values => (
                                        <>
                                          <input type="checkbox" id={"group_" + childProps.item.name} checked={inputProps.inputValue} onChange={event => {inputProps.onInputChange(event.target.checked);}} disabled={values.isGuest}/>
                                          <label htmlFor={"group_" + childProps.item.name}>{childProps.item.name}</label>
                                        </>
                                      )
                                    }
                                  </Bind>
                                )
                              }
                            </BindMultiSelectButton>
                          </li>
                        )}
                      />
                    </li>
                    <li>
                      <label><InputError target={USER_DETAIL.memo} />memo</label>
                      <BindTextArea className={styles.body} source={USER_DETAIL.memo} convert={value => value === undefined ? "" : value} />
                    </li>
                    <li>
                      <label>rank</label>
                      <BindList items={["", "A", "B", "C", "D"]}
                        template={childProps => (
                          <BindInput source={USER_DETAIL.rank} defaultValue="" convert={value => value === undefined ? "" : value} convertBack={value => value === "" ? undefined : value}>
                            {
                              inputProps => {
                                return (
                                  <select 
                                    onChange={event => {inputProps.onInputChange(event.target.value);}}  
                                    onBlur={event => {inputProps.onValidation();}}
                                    value={inputProps.inputValue === undefined ? "" : inputProps.inputValue}
                                  >
                                    <childProps.content />
                                  </select>
                                );
                              }
                            }
                          </BindInput>
                        )}
                        itemTemplate={childProps => (
                          <option value={childProps.item}>{childProps.item}</option>
                        )}
                      />
                    </li>
                  </ul>
                  <hr />
                  {values.editMode === EditMode.update 
                    ? <>
                        <button onClick={event => {saveUser();}}>save</button>
                        <button onClick={event => {reset();}}>reset</button>
                      </>
                    : <>
                        <button onClick={event => {addUser();}}>save</button>
                        <button onClick={event => {cancel();}}>cancel</button>
                    </>}
                </> 
            }
            </Bind>
        </div>
      </div>
    </>
  );
} 






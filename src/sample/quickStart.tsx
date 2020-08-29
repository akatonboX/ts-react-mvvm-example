import React from 'react';
import { $bindingPath, BindSource, BindTextBox, Bind } from 'ts-react-mvvm';


interface ViewModel{
  text: string;
}
const VIEW_MODEL = $bindingPath<ViewModel>(Symbol("viewModel"));

export function QuickStart(
  props: {
  }
) {
  return (
    <>
      <BindSource 
        sourceKey={VIEW_MODEL.$sourceKey} 
        initialValue={{text: "hoge"}}
      />
      <BindTextBox source={VIEW_MODEL.text} /><br/ >
      <Bind bindings={{
        text: VIEW_MODEL.text.$asBinding()
      }} >
        {
          values => <><span>{values.text === undefined ? "" : values.text.toUpperCase()}</span><br /></>
        }
      </Bind>

    </>
    );
}


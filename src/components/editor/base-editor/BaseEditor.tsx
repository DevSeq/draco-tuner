import * as React from 'react';
import { default as ReactMonacoEditor } from 'react-monaco-editor'; // tslint:disable-line
import './base-editor.css';

export interface BaseStateProps {
  code: string;
}

export interface BaseDispatchProps {
  onEditorCodeChange: (code: string, opt?: any) => void;
}

export interface BaseEditorProps extends BaseStateProps, BaseDispatchProps {}

export default abstract class BaseEditor<P extends BaseEditorProps, S>
    extends React.Component<P, S> {
  abstract language: string;

  constructor(props: P) {
    super(props);

    this.editorDidMount = this.editorDidMount.bind(this);
    this.editorWillMount = this.editorWillMount.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
  }

  render() {
    return (
      <div styleName="base-editor">
        <ReactMonacoEditor
          ref="monaco"
          options={{
            automaticLayout: true,
            cursorBlinking: 'smooth',
            wordWrap: 'on',
            wrappingIndent: 'same',
            scrollBeyondLastLine: false,
            minimap: {
              enabled: false,
            },
          }}
          language={this.language}
          value={this.props.code}
          theme="draco-light"
          editorDidMount={this.editorDidMount}
          editorWillMount={this.editorWillMount}
          onChange={this.handleEditorChange}
        />
      </div>
    );
  }

  protected handleEditorChange(newValue: string, e: any) {
    this.props.onEditorCodeChange(newValue);
  }

  protected editorDidMount(editor: any) {
    this.onEditorMount();
  }

  protected editorWillMount(monaco: any) {
    this.defineEditor(monaco);
  }

  abstract defineEditor(monaco: any): void;

  abstract onEditorMount(): void;
}

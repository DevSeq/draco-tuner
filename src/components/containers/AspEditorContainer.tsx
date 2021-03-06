import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { setAspCode } from '../../actions/text-editor-actions';
import { AspPrograms, AspProgramsType } from '../../model/asp-program';
import { RootState } from '../../reducers';
import AspEditor, { AspEditorDispatchProps, AspEditorOwnProps, AspEditorStoreProps } from '../presenters/asp-editor';

function mapStateToProps(state: RootState, ownProps: AspEditorOwnProps): AspEditorStoreProps {
  const code = AspPrograms.getProgramFromType(state.textEditor.asp, ownProps.id as AspProgramsType);
  return {
    code,
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: AspEditorOwnProps): AspEditorDispatchProps {
  return {
    updateStoreCode: (code: string, before: string) => {
      dispatch(setAspCode(code, ownProps.id as AspProgramsType));
    },
  };
}

export default connect<AspEditorStoreProps, AspEditorDispatchProps, AspEditorOwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(AspEditor);

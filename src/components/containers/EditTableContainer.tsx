import { connect } from 'react-redux';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { Pair } from '../../model/pair';
import { RootState } from '../../reducers';
import EditTable, { EditTableDispatchProps, EditTableOwnProps, EditTableStoreProps } from '../presenters/edit-table';
import { toggleFocusPair, toggleHoverPair } from '../../actions/pair-collection-actions';
import { revertToEdit, deleteEdit, moveEditIndex, deleteCurrentEdit } from '../../actions/draco-actions';

function mapStateToProps(state: RootState, props: EditTableOwnProps): EditTableStoreProps {
  const edits = state.draco.edits;
  const editIndex = state.draco.editIndex;
  return {
    edits,
    editIndex
  };
}

function mapDispatchToProps(
  dispatch: ThunkDispatch<{}, {}, AnyAction>,
  props: EditTableOwnProps
): EditTableDispatchProps {
  return {
    revertToEdit: (editIndex: number) => {
      dispatch(revertToEdit(editIndex));
    },
    deleteCurrentEdit: () => {
      dispatch(deleteCurrentEdit());
    },
    prevEdit: () => dispatch(moveEditIndex(-1)),
    nextEdit: () => dispatch(moveEditIndex(1))
  };
}

export default connect<EditTableStoreProps, EditTableDispatchProps, EditTableOwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(EditTable);
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import _ from 'lodash';
import reduceReducers from 'reduce-reducers';
import { combineReducers, Reducer } from 'redux';
import { createReducer } from 'redux-starter-kit';
import { ActionType, getType, StateType } from 'typesafe-actions';
import {
  appActions,
  chartCollectionActions,
  dracoActions,
  pairCollectionActions,
  RootAction,
  textEditorActions,
} from '../actions/index';
import { AspPrograms } from '../model/asp-program';
import {
  ConstraintEdit,
  ConstraintEditCheckpoint,
  ConstraintMap,
  DracoSolution,
  PairEvalMap,
  Spec,
} from '../model/index';
import appReducer, { Collection } from './app-reducer';
import chartCollectionReducer from './chart-collection-reducer';
import constraintInspecorReducer from './constraint-inspector-reducer';
import constraintTunerReducer from './constraint-tuner-reducer';
import dracoReducer from './draco-reducer';
import pairCollectionReducer from './pair-collection-reducer';
import textEditorReducer, { VegaLiteStatus } from './text-editor-reducer';

const combinedReducers = combineReducers({
  pairCollection: pairCollectionReducer,
  draco: dracoReducer,
  textEditor: textEditorReducer,
  app: appReducer,
  chartCollection: chartCollectionReducer,
  constraintTuner: constraintTunerReducer,
  constraintInspector: constraintInspecorReducer,
});

type CombinedState = StateType<typeof combinedReducers>;

const crossSliceReducer = createReducer<CombinedState, RootAction>(null, {
  [getType(pairCollectionActions.setPairs)]: setPairs,
  [getType(chartCollectionActions.setCharts)]: setCharts,
  [getType(appActions.downloadFiles)]: downloadFiles,
  [getType(appActions.addCheckpoint)]: addCheckpoint,
  [getType(appActions.updateStatus)]: updateStatus,
  [getType(textEditorActions.setVegaLiteCode)]: setVegaLiteCode,
  [getType(pairCollectionActions.addEmptyPair)]: addEmptyPair,
  [getType(textEditorActions.setAspCode)]: setAspCode,
  [getType(dracoActions.addConstraintEdit)]: addConstraintEdit,
  [getType(appActions.save)]: save,
  [getType(pairCollectionActions.deletePairs)]: deletePairs,
  [getType(chartCollectionActions.deleteCharts)]: deleteCharts,
});

export const rootReducer = reduceReducers(combinedReducers, crossSliceReducer as Reducer);

export type RootState = CombinedState;

function deletePairs(state: CombinedState, action: ActionType<typeof pairCollectionActions.deletePairs>): void {
  action.payload.forEach(pairId => {
    if (state.pairCollection.focusPair === pairId) {
      state.pairCollection.focusPair = undefined;
      state.pairCollection.focusItem = undefined;
    }
  });
}

function deleteCharts(state: CombinedState, action: ActionType<typeof chartCollectionActions.deleteCharts>): void {
  action.payload.forEach(chartId => {
    console.log(chartId);
    if (state.chartCollection.focusChart === chartId) {
      state.chartCollection.focusChart = undefined;
    }
  });
}

function setPairs(state: CombinedState, action: ActionType<typeof pairCollectionActions.setPairs>): void {
  state.draco.finishedRunIds.add(action.payload.runId);
  updateDeltaAndScore(state);

  if (action.payload.specDict.hasOwnProperty(`${state.pairCollection.focusPair}.${state.pairCollection.focusItem}`)) {
    const spec = action.payload.specDict[`${state.pairCollection.focusPair}.${state.pairCollection.focusItem}`];
    state.textEditor.vegalite.aspFacts = DracoSolution.toFactString(spec.sol);
  }
}

function setCharts(state: CombinedState, action: ActionType<typeof chartCollectionActions.setCharts>): void {
  state.draco.finishedRunIds.add(action.payload.runId);
  updateDeltaAndScore(state);

  if (action.payload.specDict.hasOwnProperty(state.chartCollection.focusChart)) {
    const spec = action.payload.specDict[state.chartCollection.focusChart];
    state.textEditor.vegalite.aspFacts = DracoSolution.toFactString(spec.sol);
  }
}

function save(state: CombinedState, action: ActionType<typeof appActions.save>): void {
  localStorage.setItem('reduxState', JSON.stringify(state));
}

function downloadFiles(state: CombinedState, action: ActionType<typeof appActions.downloadFiles>): void {
  const zip = new JSZip();

  const aspFolder = zip.folder('asp');
  const asp = ConstraintMap.toAspPrograms(state.draco.constraintMap);

  aspFolder.file('soft.lp', AspPrograms.getProgramFromType(asp, AspPrograms.SOFT_DEFINE));
  aspFolder.file('assign_weights.lp', AspPrograms.getProgramFromType(asp, AspPrograms.SOFT_WEIGHTS));
  aspFolder.file('weights.lp', AspPrograms.getProgramFromType(asp, AspPrograms.SOFT_WEIGHTS));
  aspFolder.file('hard.lp', AspPrograms.getProgramFromType(asp, AspPrograms.HARD_DEFINE));

  const pairs = JSON.stringify(state.pairCollection.pairs);
  zip.file('pairs.json', pairs);

  const charts = JSON.stringify(state.chartCollection.charts);
  zip.file('charts.json', charts);

  const constraints = JSON.stringify(state.draco.constraintMap);
  zip.file('constraints.json', constraints);

  zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, 'draco.zip'));
}

function addCheckpoint(state: CombinedState, action: ActionType<typeof appActions.addCheckpoint>): void {
  const checkpointId = state.draco.nextCheckpointId;
  state.draco.nextCheckpointId += 1;

  const pairEvalMap = PairEvalMap.fromPairsDictionary(state.pairCollection.pairs, state.draco.constraintMap);
  state.draco.checkpointMap[checkpointId] = { pairEvalMap };
  const editToAdd: ConstraintEditCheckpoint = {
    type: ConstraintEdit.CHECKPOINT,
    id: checkpointId.toString(),
    delta: state.pairCollection.pairEvalDeltaScore,
  };
  state.draco.edits.splice(0, 0, editToAdd);
  state.pairCollection.currPairEvalMap = pairEvalMap;
}

function updateStatus(state: CombinedState, action: ActionType<typeof appActions.updateStatus>): void {
  updateDeltaAndScore(state);
}

function updateDeltaAndScore(state: CombinedState) {
  const currPairEvalMap = PairEvalMap.fromPairsDictionary(state.pairCollection.pairs, state.draco.constraintMap);
  const currScore = PairEvalMap.toScore(currPairEvalMap);
  state.pairCollection.score = currScore;

  let prevCheckpointId;
  for (let i = state.draco.editIndex; i < state.draco.edits.length; i += 1) {
    const edit = state.draco.edits[i];
    if (ConstraintEdit.isCheckpoint(edit)) {
      prevCheckpointId = edit.id;
      break;
    }
  }

  if (!_.isUndefined(prevCheckpointId)) {
    const prevPairEvalMap = state.draco.checkpointMap[prevCheckpointId].pairEvalMap;
    const prevScore = PairEvalMap.toScore(prevPairEvalMap);
    const deltaMap = PairEvalMap.getPairEvalDeltaMap(prevPairEvalMap, currPairEvalMap);
    const deltaScore = currScore - prevScore;

    state.pairCollection.pairEvalDeltaMap = deltaMap;
    state.pairCollection.pairEvalDeltaScore = deltaScore;
  }
}

function setVegaLiteCode(state: CombinedState, action: ActionType<typeof textEditorActions.setVegaLiteCode>): void {
  switch (state.app.collectionPane) {
    case Collection.PAIRS:
      updatePairItemVegaLite(state, action.payload);
      break;
    case Collection.CHARTS:
      updateChartVegaLite(state, action.payload);
      break;
    default:
  }
}

function addEmptyPair(state: CombinedState, action: ActionType<typeof pairCollectionActions.addEmptyPair>): void {
  state.textEditor.vegalite.code = JSON.stringify(Spec.getEmptySpec().vlSpec, null, 2);
}

function updateChartVegaLite(state: CombinedState, code: string): void {
  const focusChartId = state.chartCollection.focusChart;
  if (!_.isUndefined(focusChartId) && state.textEditor.vegalite.status === VegaLiteStatus.OK) {
    const vlSpec = state.textEditor.vegalite.parsedVlSpec;
    const focusChart = state.chartCollection.charts[focusChartId];
    focusChart.vlSpec = vlSpec;

    state.textEditor.vegalite.aspFacts = DracoSolution.toFactString(focusChart.sol);
  }
}

function updatePairItemVegaLite(state: CombinedState, code: string): void {
  const focusPair = state.pairCollection.focusPair;
  const focusItem = state.pairCollection.focusItem;
  if (state.textEditor.vegalite.status === VegaLiteStatus.OK) {
    const vlSpec = state.textEditor.vegalite.parsedVlSpec;
    if (!!focusPair && !!focusItem) {
      const pair = state.pairCollection.pairs[focusPair];

      if (focusItem === 'left') {
        pair.left.vlSpec = vlSpec;
        state.textEditor.vegalite.aspFacts = DracoSolution.toFactString(pair.left.sol);
      } else {
        pair.right.vlSpec = vlSpec;
        state.textEditor.vegalite.aspFacts = DracoSolution.toFactString(pair.right.sol);
      }
    }
  }
}

function setAspCode(state: CombinedState, action: ActionType<typeof textEditorActions.setAspCode>): void {
  // update constraint map.
  try {
    const constraintMap = ConstraintMap.fromAspPrograms(state.textEditor.asp);
    state.draco.constraintMap = constraintMap;
  } catch (error) {}
}

function addConstraintEdit(state: CombinedState, action: ActionType<typeof dracoActions.addConstraintEdit>): void {
  const edit = action.payload;

  if (ConstraintEdit.isAddEdit(edit)) {
    state.constraintTuner.focusConstraint = ConstraintEdit.NEW_CONSTRAINT_NAME;
  }

  if (ConstraintEdit.isAspEdit(edit)) {
    const beforeMatch = /\w+\((\w*),?\)?/.exec(edit.before);
    const afterMatch = /\w+\((\w*),?\)?/.exec(edit.after);

    if (beforeMatch && afterMatch) {
      const nameBefore = beforeMatch[1];
      const nameAfter = afterMatch[1];

      state.constraintTuner.focusConstraint = nameAfter;
    }
  }

  const constraintMap = state.draco.constraintMap;
  const oldAsp = state.textEditor.asp;
  const newAsp = ConstraintMap.toAspPrograms(constraintMap);
  state.textEditor.asp = {
    ...oldAsp,
    ...newAsp,
  };
}

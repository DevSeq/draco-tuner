import classnames from 'classnames';
import _ from 'lodash';
import * as React from 'react';
import { PairFilter, PairFilterType } from '../../../model';
import { EvalMinimapContainer, PairCardContainer } from '../../containers';
import './pair-collection.css';

export interface PairCollectionStoreProps {
  pairIds: string[];
  finishedRunIds: Set<number>;
}

export interface PairCollectionDispatchProps {
  reloadPairs: (runId: number) => void;
  clearFocusPair: () => void;
  setPairFilters: (filterTypes: PairFilterType[]) => void;
}

export interface PairCollectionOwnProps {}

export interface PairCollectionProps
  extends PairCollectionStoreProps,
    PairCollectionDispatchProps,
    PairCollectionOwnProps {}

export interface PairCollectionState {
  selectedPairs: Set<string>;
  runId?: number;
}

export default class PairCollection extends React.PureComponent<PairCollectionProps, PairCollectionState> {
  private prevFilterTypes: PairFilterType[];

  constructor(props: PairCollectionProps) {
    super(props);

    this.state = {
      selectedPairs: new Set(),
    };

    this.toggleSelectedPairs = this.toggleSelectedPairs.bind(this);
    this.prevFilterTypes = [];
  }

  render() {
    const pairCards = this.props.pairIds.map((id, i) => {
      return (
        <PairCardContainer
          key={i}
          id={id}
          open={this.state.selectedPairs.has(id)}
          selectPair={(id: string, on: boolean) => this.toggleSelectedPairs([id], on)}
        />
      );
    });

    const reloadButtonStyle = classnames({
      reloading: !_.isUndefined(this.state.runId) && !this.props.finishedRunIds.has(this.state.runId),
    });

    return (
      <div styleName="pair-collection">
        <div styleName="controls">
          <div styleName="button-container">
            <button
              styleName={reloadButtonStyle}
              onClick={() => {
                const runId = (window as any).runId;
                (window as any).runId += 1;

                this.setState({
                  runId,
                });
                this.props.reloadPairs(runId);
              }}
            >
              reload
            </button>
          </div>
          <div styleName="button-container">
            <button
              className="material-icons"
              styleName="icon-button"
              onClick={() => {
                const selectedPairs = this.props.pairIds.reduce((set, id) => {
                  set.add(id);
                  return set;
                }, new Set<string>());

                this.setState({ selectedPairs });
              }}
            >
              unfold_more
            </button>
            <button
              className="material-icons"
              styleName="icon-button"
              onClick={() => {
                const selectedPairs = new Set();
                this.setState({ selectedPairs });
                // this.props.clearFocusPair();
              }}
            >
              unfold_less
            </button>
          </div>
          <div styleName="button-container">
            <input
              placeholder="filter"
              onChange={event => {
                const val = event.target.value;
                const filterTypes = PairFilter.getTypesFromString(val);

                if (!_.isEqual(this.prevFilterTypes, filterTypes)) {
                  this.prevFilterTypes = filterTypes;
                  this.props.setPairFilters(filterTypes);
                }
              }}
            />
          </div>
        </div>
        <div styleName="view">
          <div styleName="minimap">
            <EvalMinimapContainer pairIds={this.props.pairIds} />
          </div>
          <div styleName="pairs">{pairCards}</div>
        </div>
      </div>
    );
  }

  toggleSelectedPairs(ids: string[], on: boolean) {
    this.setState((state, props) => {
      const selectedPairs = _.clone(state.selectedPairs);
      ids.forEach(id => {
        if (on) {
          selectedPairs.add(id);
        } else {
          selectedPairs.delete(id);
        }
      });
      return { selectedPairs };
    });
  }
}
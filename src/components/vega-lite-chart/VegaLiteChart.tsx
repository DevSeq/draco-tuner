import classnames from 'classnames';
import { vl2asp } from 'draco-vis';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { getType } from 'typesafe-actions';
import vegaEmbed, { EmbedOptions, vega } from 'vega-embed';
import { TopLevelSpec } from 'vega-lite';
import { TopLevelFacetedUnitSpec } from 'vega-lite/build/src/spec';
import { RootAction } from '../../actions';
import { runDraco } from '../../actions/draco-actions';
import { setInfoPaneAsp, setInfoPaneDracoSolutionSet, showInfoPane } from '../../actions/editor-actions'; // tslint:disable-line
import './vega-lite-chart.css';

const cars = require('../../data/cars.json');
const barley = require('../../data/barley.json');

export const datasets = {
  'cars.json': cars,
  'barley.json': barley,
};

interface DispatchProps {
  runDraco: (code: string) => void;
  setInfoPaneAsp: (code: string) => void;
  showInfoPane: (show: boolean) => void;
}

interface PassedProps {
  vlSpec: TopLevelSpec;
  renderer: 'canvas' | 'svg';
  actions?: boolean;
}

interface Props extends PassedProps, DispatchProps {}

interface State {}

/**
 * A Visualization component accepts a `vlSpec` as a prop
 * and renders the resulting svg.
 */
class VegaLiteChart extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.updateView(this.props.vlSpec);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.vlSpec !== this.props.vlSpec) {
      this.updateView(nextProps.vlSpec);
    }
  }

  render() {
    const styles = classnames({
      'vega-lite-chart': true,
      'no-actions': !this.props.actions,
    });

    return (
      <div
        styleName={styles}
        ref="vis"
        onClick={this.handleClick}
      >
      </div>
    );
  }

  /**
   * Updates this to use the given vlSpec.
   *
   * @param {Object} vlSpec The Vega-Lite spec to use.
   */
  updateView(vlSpec: TopLevelSpec) {
    if (!vlSpec) {
      console.warn('no spec passed to viz view');
      return;
    }

    const loader = vega.loader();

    const originalHttp = loader.http;
    loader.http = (url, options) => {
      console.debug('Request for', url);

      if (url in datasets) {
        // @ts-ignore
        return datasets[url];
      }
      return originalHttp.bind(loader)(url, options);
    };

    const element = this.refs.vis as HTMLElement;

    const opt: EmbedOptions = {
      loader,
      renderer: this.props.renderer,
      mode: 'vega-lite',
      defaultStyle: true,
      actions: typeof this.props.actions === 'undefined' ? true : this.props.actions,
    };

    // @ts-ignore
    vegaEmbed(element, vlSpec, opt);
  }

  handleClick() {
    const asp = vl2asp(this.props.vlSpec as TopLevelFacetedUnitSpec);
    const program = `${asp.join('.\n')}.\n`;
    console.debug(program);
    this.props.setInfoPaneAsp(program);
    this.props.runDraco(program);
    this.props.showInfoPane(true);
  }
}

const mapDispatchToProps = (dispatch: Dispatch<RootAction>): DispatchProps => {
  return {
    runDraco: (code: string) => {
      dispatch(runDraco(code, getType(setInfoPaneDracoSolutionSet)));
    },
    setInfoPaneAsp: (code: string) => {
      dispatch(setInfoPaneAsp(code));
    },
    showInfoPane: (show: boolean) => {
      dispatch(showInfoPane(show));
    },
  };
};

export default connect(
  null,
  mapDispatchToProps,
)(VegaLiteChart);

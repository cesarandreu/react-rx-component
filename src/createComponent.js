import React, { Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { funcSubject } from './';

function unwrapLast(o$) {
  let value;
  o$.subscribe(v => value = v).dispose();
  return value;
}

export default function createComponent(createChildPropsSeq, render) {
  return class extends Component {
    constructor(props) {
      super(props);

      // Used to receive props from owners
      this.pushProps$ = funcSubject();

      // Sequence of props received from owner
      this.props$ = this.pushProps$.startWith(props);

      // Sequence of child props
      this.childProps$ = createChildPropsSeq(this.props$);

      this.state = {
        // Get the initial state
        childProps: unwrapLast(this.childProps$)
      };
    }

    componentDidMount() {
      // Subscribe to child prop changes so we know when to re-render
      // Skip the first set of props, which were already rendered
      this.subscription = this.childProps$.skip(1).subscribe(
        // Use setState to trigger a re-render
        childProps => this.setState({ childProps })
      );
    }

    componentWillReceiveProps(newProps) {
      // Receive new props from the owner
      this.pushProps$(newProps);
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    componentWillUnmount() {
      // Clean-up subscription before un-mounting
      this.subscription.dispose();
    }

    render() {
      const { childProps } = this.state;
      const { children } = this.props;

      if (typeof render === 'function') {
        return render(childProps);
      }

      if (typeof children === 'function') {
        return children(childProps);
      }
    }
  };
}
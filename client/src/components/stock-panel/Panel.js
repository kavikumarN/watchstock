import React, { Component } from 'react';
import './Panel.css';

class Panel extends Component {
  render() {
    return (
      <div id="panel" className={this.props.classes}>
       This is panel.
      </div>
    );
  }
}

export default Panel;

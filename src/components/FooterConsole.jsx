import { Input, message } from 'antd';
import { api } from '../api.js';
import React, { Component } from 'react';


export default class ControlPanel extends Component {
  state = {
    value: ""
  }

  onRunCommand = (e) => {
    const command = e.target.value;
    document.getElementById('console').blur();
    const parts = command.split(' ');
    if (parts.length === 0) return;
    if (parts[0] === 'find') {
      const local_id = api.local_ids[parts[1]];
      const ele = window.cy.$(`#${local_id}`);
      if (ele.length === 0) {
        message.warning('Not found!');
        return;
      }
      window.cy.zoom(1.2);
      window.cy.center(ele);
      ele.emit('click');
      ele.select();
    }
    else if (parts[0] === 'task') {
      const name = parts[1];
      const ele = window.cy.$(`node[label = "Task"][data.name = '${name}']`);
      if (ele.length === 0) {
        message.warning('Not found!');
        return;
      }
      window.cy.zoom(0.9);
      window.cy.center(ele);
      ele.emit('click');
      ele.select();
    }
    else if (parts[0] === 'concept') {
      const name = parts[1];
      const ele = window.cy.$(`node[label = "Concept"][data.name = '${name}']`);
      if (ele.length === 0) {
        message.warning('Not found!');
        return;
      }
      window.cy.zoom(0.9);
      window.cy.center(ele);
      ele.emit('click');
      ele.select();
    } else {
      message.warning('Unknown command!');
    }
  }

  render = () => {
    return (
      <>
        <Input className="console" value={this.state.value} onChange={(e) => {
            if (e.target.value.endsWith('/')) {
              this.setState({value: ""});
            } else {
              this.setState({value: e.target.value});
            }
          }} id="console" addonBefore={`Console`} placeholder="Enter command" onPressEnter={this.onRunCommand}
          onBlur={(e) => {this.setState({value: ""});}}
        />
      </>
    )
  }
}

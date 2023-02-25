import cytoscape from 'cytoscape';

import { Button, Input } from 'antd';
import { KBEdge, KBNode } from '../nodes.js';
import { api } from '../api.js';
import NodeEditor from './NodeEditor.jsx';

import React, { Component } from 'react';


const NODE_TYPES_v4 = {
    'TaskNode': {
      fields: {
        _task: "-",
      }
    },
    'InterfaceNode': {
      fields: {
        interface: "KB",
        action: "-",
      }
    },
    'Concept': {
      fields: {
        name: "-",
      }
    },
    'Field': {
      fields: {
        concept: "-",
        name: "-",
        primary: "0",
      }
    },
    'Task': {
      fields: {
        name: "-",
      }
    },
    'Ref': {
      fields: {
        path: "obj.outputs.result",
      }
    },
    'ExitNode': {
      fields: {
      }
    },
    'ReturnNode': {
      fields: {
        value: "-",
        name: "-",
      }
    },
    'Word': {
      fields: {
        value: "-",
        type: "Noun",
      }
    },
    'Pattern': {
      fields: {
        concept: "",
        value: "",
        many: "0",
        optional: "0",
        capture: "1",
      }
    },
    'PatternGroup': {
      fields: {
        many: "0",
        optional: "0",
        capture: "1",
      }
    },
};

const NODE_TYPES = {
    'Concept': {
      fields: {
        name: "-",
      }
    },
    'Field': {
      fields: {
        concept: "-",
        name: "-",
        primary: "0",
      }
    },
    'Task': {
      fields: {
        name: "-",
      }
    },
    'Word': {
      fields: {
        value: "-",
        type: "Noun",
      }
    },
    'Pattern': {
      fields: {
      }
    },
    'PatternNode': {
      fields: {
        concept: "",
        value: "",
        many: "0",
        optional: "0",
        capture: "1",
      }
    },
    'PatternGroup': {
      fields: {
        many: "0",
        optional: "0",
        capture: "1",
      }
    },
};




export default class ControlPanel extends Component {
  state = {
    selected_node: null,
    node_title: null,
  }

  onNodeSelected = (node) => {
    this.setState({selected_node: node, node_title: node ? node.data().label: null});
  }

  saveFields = (node, data) => {
    console.log(node.data());
    console.log(data);
    node.data({data});
    console.log(node.data());
    this.props.onAction("set_data", {
      "element": node,
      "data": data,
    });
    this.onSaveNodeName(node);
  }

  componentDidMount = () => {
    this.props.sendSelf(this);
  }

  onSaveNodeName = (node) => {
    if (node.data().label === this.state.node_title) {
      return;
    }
    this.props.onAction("rename", {
      "element": node || this.state.selected_node,
      "new_name": this.state.node_title
    });
  }

  render = () => {
    const node_btns = Object.keys(NODE_TYPES).map((name) => {
      return (<Button key={name} type="default" onClick={() => {
        const fields = NODE_TYPES[name].fields || {};
        this.props.onAction("add_node", new KBNode(name, fields, 100, 120));
      }}>{name}</Button>);
    });
    let node_id = null;
    if (this.state.selected_node !== null) {
      if (this.state.selected_node.isNode()) {
        node_id = api.remote_ids[this.state.selected_node.id()];
      } else {
        node_id = api.remote_edge_ids[this.state.selected_node.id()];
      }
    }
    return (
      <>
        <div className="add">
          {node_btns}
        </div>
        <div className="params">
          <>
            {(this.state.selected_node === null ? null : <div className="title-editor"><Input addonBefore={`Label (${node_id})`} value={this.state.node_title} onChange={(e) => {this.setState({node_title: e.target.value})}} onPressEnter={this.onSaveNodeName} /></div>)}
            <NodeEditor node={this.state.selected_node} saveFields={this.saveFields}/>
          </>
        </div>
      </>
    )
  }
}

import cytoscape from 'cytoscape';

import { api } from '../api.js';
import { task_api } from '../task_api.js';
import { KBEdge, KBNode } from '../nodes.js';
import { message } from 'antd';
import React, { Component } from 'react';

//import coseBilkent from 'cytoscape-cose-bilkent';
//cytoscape.use( coseBilkent );

//import cola from 'cytoscape-cola';
//cytoscape.use( cola );

var jquery = require('jquery');
var clipboard = require('cytoscape-clipboard');

clipboard( cytoscape, jquery );


var cy = null;

var pressed = {};

document.onkeydown=function(e){
     e = e || window.event;
     pressed[e.keyCode] = true;
     if (e.keyCode === 8 && (pressed[91] || pressed[93])) {
       cy.remove(':selected');
     }

     if (e.keyCode === 191 && document.activeElement.tagName !== "INPUT") {
       document.getElementById('console').focus();
     }

     if (e.keyCode === 27) {
       document.getElementById('console').blur();
     }

     const cmd_pressed = pressed[91];
     const ctrl_pressed = pressed[17];
     const shift_pressed = pressed[16];
     const c_pressed = pressed[67];
     const v_pressed = pressed[86];

     if (cmd_pressed && c_pressed && document.activeElement.tagName !== "INPUT") {
       console.log('copy', cy.$(':selected'));
       cy.clipboard.copy(cy.$(':selected'));
       pressed[67] = false;
     }
     else if (cmd_pressed && v_pressed && document.activeElement.tagName !== "INPUT") {
       console.log('paste');
       cy.$(':selected').unselect();
       cy.clipboard.paste();
       pressed[86] = false;
     }
}

document.onkeyup=function(e){
     e = e || window.event;

     const cmd_pressed = pressed[91];
     const ctrl_pressed = pressed[17];

     if (cmd_pressed || ctrl_pressed) {
       pressed = {};
     }

     delete pressed[e.keyCode];
}

const infer_edge = (start, end) => {
  const sl = start.data().label;
  const el = end.data().label;
  if (sl === 'Task' && el.endsWith('Node')) {
    return ['head', {}];
  }
  if (sl === 'Concept' && el === 'Concept') {
    return ['parents', {"pattern": "0"}];
  }
  if (sl === 'Concept' && el === 'Field') {
    return ['fields', {"name": "-"}];
  }
  if (sl.endsWith('Node') && el.endsWith('Node')) {
    return ['next', {}];
  }
  if (sl.endsWith('Node') && el === 'Ref') {
    return ['inputs', {"name": "-"}];
  }
  if (sl === 'Ref' && el.endsWith('Node')) {
    return ['obj', {}];
  }
  if (sl === 'Task' && el === 'Concept') {
    return ['inputs', {"name": "-"}];
  }
  if (sl === 'Concept' && (el === 'Pattern' || el === 'PatternGroup')) {
    return ['patterns', {}];
  }
  if (sl === 'Pattern' && el === 'Pattern') {
    return ['next', {"name": ""}];
  }
  if (sl === 'Pattern' && el === 'PatternGroup') {
    return ['next', {"name": ""}];
  }
  if (sl === 'PatternGroup' && el === 'PatternGroup') {
    return ['next', {"name": ""}];
  }
  if (sl === 'Pattern' && el === 'PatternGroup') {
    return ['head', {}];
  }
  if (sl === 'Field' && (el === 'Pattern' || el === 'PatternGroup')) {
    return ['extractor', {
      "cardinality": "ONE",
    }];
  }
  if (sl === 'List' && el === 'ListElement') {
    return ['next', {}];
  }
  if (sl === 'ListElement' && el === 'ListElement') {
    return ['next', {}];
  }
  if (sl === 'Word' && el === 'Concept') {
    return ['word', {}];
  }
  if (sl === 'ListElement') {
    return ['value', {}];
  }
  return ['temp', {}];
}


function create_node(start, is_task) {
  if (start === null) {
    return false;
  }
  let props = start.properties;
  let meta = JSON.parse(props['_meta'] || "{}");
  delete props['_meta'];

  if (meta.hidden === true && !is_task) {
    return false;
  }

  if (!api.created_nodes.has(start.elementId)) {
    api.created_nodes.add(start.elementId);
    let node = new KBNode(start.labels[0], props, meta.x || Math.random() * 500, meta.y || Math.random() * 500);
    api.link(node.id, start.elementId);
    cy.add({
      group: 'nodes',
      data: {
        id: node.id,
        label: node.label,
        weight: 75,
        data: node.data,
      },
      position: { x: node.x, y: node.y },
    });
  }
  return true;
}


function create_scene(props, addEdge) {
  const myDiv = document.getElementById("display");
  cy = cytoscape({
    container: myDiv,
    wheelSensitivity: 0.4,
    style: [{
      "selector": "node[label]",
      "style": {
        "label": "data(label)",
        "text-valign": "center",
        "text-halign": "center",
        "width": 90,
        "height": 90,
        "text-wrap": "wrap",
        "text-max-width": 60,
        "font-size": 10,
      }
    }, {
      "selector": 'node[label = "Concept"]',
      "style": {
        "label": function( ele ){ return "<Concept>\n" + ele.data('data').name },
        "background-color": "#e76f51",
        "width": 130,
        "height": 130,
        "text-max-width": 100,
        "font-size": 14,
      }
    }, {
      "selector": 'node[label = "ShellExecutable"]',
      "style": {
        "label": function( ele ){ return "<ShellExecutable>\n" + ele.data('data').name },
      }
    }, {
      "selector": 'node[label = "Field"]',
      "style": {
        "label": function( ele ){ return "<Field>\n" + ele.data('data').name },
        "background-color": "#219ebc",
        "width": 100,
        "height": 100,
        "text-max-width": 80,
        "font-size": 12,
      }
    }, {
      "selector": 'node[label = "Task"]',
      "style": {
        "content": function( ele ){ return "<Task>\n" + ele.data('data').name },
        "background-color": "#e9c46a",
        "width": 130,
        "height": 130,
        "text-max-width": 100,
        "font-size": 14,
      }
    }, {
      "selector": 'node[label = "ReturnNode"]',
      "style": {
        "content": function( ele ){ return "Return\n" + ele.data('data').name + "" },
        "background-color": "#e4c1f9",
      }
    }, {
      "selector": 'node[label = "Ref"]',
      "style": {
        "content": function( ele ){ return ele.data('data').path },
        "background-color": "#57cc99",
        "width": 200,
        "height": 40,
        "shape": "rectangle",
        "text-max-width": null,
        "font-size": 14,
      }
    }, {
      "selector": 'node[label = "TaskNode"]',
      "style": {
        "content": function( ele ){ return "<Task>\n" + ele.data('data')._task + '()' },
        "background-color": "#b56576",
      }
    }, {
      "selector": 'node[label = "ExitNode"]',
      "style": {
        "background-color": "#e9d8a6",
      }
    }, {
      "selector": 'node[label = "InterfaceNode"]',
      "style": {
        "content": function( ele ){ return ele.data('data').interface + "\n" + ele.data('data').action + '()' },
        "background-color": "#5f0f40",
        "color": "white",
      }
    }, {
      "selector": 'node[label = "Word"]',
      "style": {
        "content": function( ele ){ return "Word\n" + ele.data('data').value },
        "background-color": "#003049",
        "color": "white",
      }
    }, {
      "selector": 'node[label = "MathNode"]',
      "style": {
        "content": function( ele ){ return "MathNode\n" + (ele.data('data').op ? ele.data('data').op : "?") },
        "background-color": "#d6ccc2",
        "color": "#0d1b2a",
      }
    }, {
      "selector": 'node[label = "Pattern"]',
      "style": {
        "content": function( ele ){ return "Pattern\n" + (ele.data('data').concept + (ele.data('data').many === '0' ? "" : "+") + (ele.data('data').optional === '0' ? "" : "?")  + '\n' + (!!ele.data('data').value ? ('"' + ele.data('data').value + '"') : "")) },
        "background-color": "#577590",
        "color": "white",
      }
    }, {
      "selector": "edge",
      "style": {
        "width": 1,
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 2,
        'curve-style': 'bezier',
        'color': 'white',
      }
    }, {
      "selector": "edge[label]",
      "style": {
        "label": "data(label)",
      }
    }, {
      "selector": "edge[label = 'next']",
      "style": {
        "label": function( ele ){ return "next" +  (ele.data('data').name ? ('[ ' + ele.data('data').name + ' ]') : "") },
        "width": 5
      }
    }, {
      "selector": "edge[label = 'head']",
      "style": {
        "width": 5
      }
    }, {
      "selector": "edge[label = 'value']",
      "style": {
        "label": function( ele ){ return "value" +  (ele.data('data').name ? ('[ ' + ele.data('data').name + ' ]') : "") },
      }
    }, {
      "selector": "edge[label = 'parents']",
      "style": {
        "label": function( ele ){ return "parents" +  ((ele.data('data').pattern === '1') ? ('[ pattern ]') : "") },
        "width": 5
      }
    }, {
      "selector": "edge[label = 'input']",
      "style": {
        "label": function( ele ){ return "input" +  (ele.data('data').name ? ('[ ' + ele.data('data').name + ' ]') : "") },
      }
    }, {
      "selector": "edge[label = 'obj']",
      "style": {
      }
    },{
      "selector": "edge[label = 'inputs']",
      "style": {
        "label": function( ele ){ return "inputs" +  (ele.data('data').name ? ('[ ' + ele.data('data').name + ' ]') : "") },
      }
    },{
      "selector": "edge[label = 'keys']",
      "style": {
        "label": function( ele ){ return "keys" +  (ele.data('data').name ? ('[ ' + ele.data('data').name + ' ]') : "") },
      }
    }, {
      "selector": ":selected",
      "style": {
        "overlay-color": "blue",
        "overlay-opacity": 0.1,
        "overlay-padding": 5,
      }
    }, {
      "selector": "node[debug_pointer = 'yes']",
      "style": {
        "overlay-color": "green",
        "overlay-opacity": 0.2,
        "overlay-padding": 5,
      }
    }]
  });
  window.cy = cy;
  cy.style.background = "black";
  cy.zoom(0.2);

  cy.minZoom(0.025);
  cy.maxZoom(2);

  cy.on('click', 'node', function(evt) {
    const selected = cy.$(':selected');

    props.onNodeSelected(this);

    if (selected.length === 1 && pressed[91]) {
      const start = selected[0];
      const end = this;
      const [edge_type, edge_props] = infer_edge(start, end);
      const edge = addEdge(new KBEdge(edge_type, edge_props, start.id(), end.id()));
      cy.$('*').unselect();
      api.request('create_edge', {
        label: edge_type,
        start: start.id(),
        end: end.id(),
        local_id: edge.id,
      }).then(() => {
        api.request('set_edge_data', {
          edge: cy.$('#'+edge.id),
          data: edge_props,
        })
      });
    }
  });

  cy.on('click', 'edge', function(evt) {
    props.onNodeSelected(this);
  });

  cy.on('free', '*', function(evt) {
    api.request('set_meta', {
      node: this,
    });
  });

  cy.on('unselect', '*', function(evt) {
    setTimeout(() => {
      const selected = cy.$(':selected');

      if (selected.length === 0) {
        props.onNodeSelected(null);
      }
    }, 100);
  });

  cy.on('remove', 'node', function(evt) {
    props.onNodeSelected(null);
    api.request('remove_node', {
      id: this.id()
    });
  });

  cy.on('remove', 'edge', function(evt) {
    props.onNodeSelected(null);
    console.log(this.id());
    api.request('remove_edge', {
      id: this.id()
    });
  });

  cy.clipboard = cy.clipboard({
    afterPaste: (eles) => {
      console.log('after', eles);
      eles.map((x) => {
        if (x.isEdge()) {
          console.log(x.data());
          api.request('create_edge', {
            label: x.data().label,
            start: x.data().source,
            end: x.data().target,
            local_id: x.id(),
          }).then(() => {
            api.request('set_edge_data', {
              edge: cy.$('#'+x.id()),
              data: x.data().data,
            })
          });
        } else {
          api.request('create_node', {
            "label": x.data().label,
            "local_id": x.id(),
          }).then(() => {
            api.request('set_meta', {
              "node": cy.$('#' + x.id()),
            });
            api.request("set_node_data", {
              node: cy.$('#' + x.id()),
              data: x.data().data || {},
            });
          });
        }
        return null;
      });
    }
  });

//  cy.layout({
//    name: 'cola',
//    padding: 10,
//    refresh: 10,
//    edgeLength: 300,
//    boundingBox: {x1: 0, y1: 0, w: 1000, h: 1000}
//  }).run()

  return cy;
}


export default class Display extends Component {
  componentDidMount = () => {
    this.props.sendSelf(this);

    this.cy = create_scene(this.props, this.addEdge);

    task_api.on_message("callback_name1", (msg) => {
      if (msg.action === 'pause' && msg.data.node_id !== null) {
        const old_ele = window.cy.$("node[debug_pointer = 'yes']");
        old_ele.data().debug_pointer = 'no';
        old_ele.style('overlay-opacity', '0.0');

        setTimeout(() => {
          const ele = window.cy.getElementById(api.local_ids[msg.data.node_id]);
          ele.data().debug_pointer = 'yes';
          ele.style('overlay-color', 'green');
          ele.style('overlay-opacity', '0.2');
        }, 25);
      }
      console.log('msg', msg);
    });

    this.loadData(this.props.is_task, this.props.task_head_id);

    if (this.props.is_task) {
      task_api.on_task_head_id((task_head_id) => {
        this.loadData(true, task_head_id);
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadData(nextProps.is_task, nextProps.task_head_id);
  }

  loadData = (is_task, task_head_id) => {
    if (is_task && task_head_id === null) {
      return;
    }
    api.getAll().then((results) => {
      let filtered_ids = new Set();

      const non_unique_nodes = results.map(x => x.get('n')).concat(results.map(x => x.get('m'))).filter(x => x !== null);
      const non_unique_edges = results.map(x => x.get('r')).filter(x => x !== null);
      const node_ids = new Set();
      const edge_ids = new Set();
      const nodes = [];
      const edges = [];

      for (let node of non_unique_nodes) {
        if (!node_ids.has(node.elementId)) {
          node_ids.add(node.elementId);
          nodes.push(node);
        }
      }

      for (let edge of non_unique_edges) {
        if (!edge_ids.has(edge.elementId)) {
          edge_ids.add(edge.elementId);
          edges.push(edge);
        }
      }

      const dump = JSON.parse(JSON.stringify({
        "nodes": nodes,
        "edges": edges,
      }));
      dump.nodes = dump.nodes.map(x => {
        delete x.identity;
        x.label = x.labels[0];
        delete x.labels;
        return x;
      });
      dump.edges = dump.edges.map(x => {
        delete x.identity;
        delete x.start;
        delete x.end;
        return x;
      });
      console.log(dump);

      if (is_task) {
        const head = nodes.filter(x => x.elementId === task_head_id.toString())[0];
        let new_node_ids = new Set([head.elementId]);
        filtered_ids.add(head.elementId);

        while (task_head_id !== undefined) {
            const future_new_node_ids = new Set();

            for (let triple of results) {
              let start = triple.get('n');
              let edge = triple.get('r');
              let end = triple.get('m');
              if (end === null) {
                continue;
              }
              if (new_node_ids.has(start.elementId) && !filtered_ids.has(end.elementId)) {
                filtered_ids.add(end.elementId);
                future_new_node_ids.add(end.elementId);
              }
            }

            if (future_new_node_ids.size === 0) {
              break;
            }

            new_node_ids = future_new_node_ids;
        }
      }

      api.created_nodes.clear();
      api.created_edges.clear();
      api.local_ids.clear();
//      api.remote_ids.clear();
      api.local_edge_ids.clear();
//      api.remote_edge_ids.clear();
      this.cy = create_scene(this.props, this.addEdge);

      for (let tripple of results) {
        let start = tripple.get('n');
        let edge = tripple.get('r');
        let end = tripple.get('m');

        let shown_count = 0;

        if (!is_task || (start !== null && filtered_ids.has(start.elementId))) {
          shown_count += create_node(start, is_task);
        }
        if (!is_task || (end !== null && filtered_ids.has(end.elementId))) {
          shown_count += create_node(end, is_task);
        }

        if (edge !== null && !api.created_edges.has(edge.elementId) && shown_count === 2) {
          api.created_edges.add(edge.elementId);

          let props = edge.properties;
          let meta = JSON.parse(props['_meta'] || "{}");
          delete props['_meta'];

          let node = new KBEdge(edge.type, props, api.local_ids[edge.start], api.local_ids[edge.end]);
          api.linkEdge(node.id, edge.elementId);
          this.addExistingEdge(node);
        }
      }

      if (is_task) {
        cy.center();
        const ele = window.cy.$(`#${api.local_ids[task_head_id]}`)[0];
        ele.data().debug_pointer = 'yes';
      }
    });
  }

  addExistingEdge = (edge) => {
    this.cy.add({
      group: 'edges',
      data: {
        id: edge.id,
        label: edge.label,
        source: edge.start,
        target: edge.end,
        data: edge.data,
        type: "triangle"
      },
      pannable: true
    });
    return edge;
  }

  onAction = (action, data) => {
    if (action === "add_node") {
      this.addNode(data);
    }
    else if (action === "remove") {
      this.cy.remove("#" + data);
    }
    else if (action === "rename") {
      const old_name = data.element.data().label;
      data.element.data("label", data.new_name);
      if (data.element.isNode()) {
        api.request("rename_node", {
          node: data.element,
          new_name: data.new_name,
          old_name: old_name,
        })
      } else {
        api.request("rename_edge", {
          edge: data.element,
          new_name: data.new_name,
        })
      }
    }
    else if (action === "set_data") {
      data.element.data(data.data);
      if (data.element.isNode()) {
        api.request("set_node_data", {
          node: data.element,
          data: data.data,
        })
      } else {
        api.request("set_edge_data", {
          edge: data.element,
          data: data.data,
        })
      }
    }
  }

  addNode = (node) => {
    const canv = document.getElementById("display");
    this.cy.add({
        group: 'nodes',
        data: {
          id: node.id,
          label: node.label,
          weight: 75,
          data: node.data,
        },
        renderedPosition: { x: canv.clientWidth / 3, y: canv.clientHeight / 2 }
    });
    api.request('create_node', {
      "label": node.label,
      "local_id": node.id,
    }).then(() => {
      api.request('set_meta', {
        "node": this.cy.$('#' + node.id),
      });
      api.request("set_node_data", {
        node: this.cy.$('#' + node.id),
        data: node.data,
      });
    });

    return node;
  }

  addEdge = (edge) => {
    this.cy.add({
      group: 'edges',
      data: {
        id: edge.id,
        label: edge.label,
        source: edge.start,
        target: edge.end,
        data: edge.data,
        type: "triangle"
      },
      pannable: true
    });
    return edge;
  }

  render = () => {
    return (
      <div id="display"></div>
    )
  }
}

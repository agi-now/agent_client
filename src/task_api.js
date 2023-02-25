import neo4j from 'neo4j-driver';
import { message } from 'antd';


class TaskAPI {
  constructor() {
    this.ws = new WebSocket("ws://localhost:19899");
    this.callbacks = {};
    this.task_head_id_clb = null;
    this.task_head_id = null;
    this.ws.onmessage = this._clb;
  }

  on_message = (name, callback) => {
    this.callbacks[name] = callback;
  }

  on_task_head_id = (clb) => {
    if (this.task_head_id !== null) {
      clb(this.task_head_id);
    }
    this.task_head_id_clb = clb;
  }

  _clb = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.action === "pause") {
      this.task_head_id = msg.data.head_id;
      if (this.task_head_id_clb) {
        this.task_head_id_clb(msg.data.head_id, msg.data.node_id);
      }
    } else {
      for (let callback of Object.values(this.callbacks)) {
        callback(msg);
      }
    }
  }

  step = () => {
    this.ws.send(JSON.stringify({
      "action": "step",
      "data": {}
    }));
  }

  continue_ = () => {
    this.ws.send(JSON.stringify({
      "action": "continue",
      "data": {}
    }));
  }

};

export const task_api = new TaskAPI();
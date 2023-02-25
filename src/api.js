import neo4j from 'neo4j-driver';
import { message } from 'antd';


function get_meta(node) {
  return JSON.stringify({
    id: node.id(),
    x: node.position().x,
    y: node.position().y,
  });
}


class API {
  constructor() {
    this.driver = neo4j.driver(
      'neo4j://localhost',
      neo4j.auth.basic('neo4j', 'test')
    )
    this.session = this.driver.session();
    this.created_nodes = new Set();
    this.created_edges = new Set();
    this.local_ids = new Map();
    this.remote_ids = new Map();
    this.local_edge_ids = new Map();
    this.remote_edge_ids = new Map();
    this.requests = [];
    setTimeout(() => {this.run()}, 100);
    this.counter = null;
  }

  link = (lid, rid) => {
    this.local_ids[rid] = lid;
    this.remote_ids[lid] = rid;
  }

  linkEdge = (lid, rid) => {
    this.local_edge_ids[rid] = lid;
    this.remote_edge_ids[lid] = rid;
  }

  getAll = () => {
    return this.cypher('MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN * LIMIT 20000');
  }

  cypher = (query) => {
    return new Promise((resolve, reject) => {
       const session = this.driver.session();
       session.run(query).then(result => {
          resolve(result.records);
        })
        .catch(error => {
          console.log(error);
          reject(error);
        })
        .then(() => session.close())
    });
  }

  request = (name, data) => {
    return new Promise((resolve, reject) => {
      this.requests.push([name, data, resolve, reject]);
    });
  }

  processRequest = () => {
    if (this.counter !== null) {
      document.getElementById('requests_count').innerHTML = this.requests.length.toString();
    }
    if (this.requests.length === 0) return;
    for (let i = 0; i < Math.min(this.requests.length, 20); i++) {
      const [name, data, resolve, reject] = this.requests.shift();
      if (name === "set_meta") {
        const _id = this.remote_ids[data.node.id()];
        const meta = get_meta(data.node);
        this.cypher(`MATCH (n) WHERE id(n) = ${_id} SET n._meta = '${meta}' RETURN n`).then((r) => {
          resolve(r);
        })
      }
      else if (name === "set_node_data") {
        const _id = this.remote_ids[data.node.id()];
        const node_data = Object.assign({}, data.data);
        node_data['_meta'] = get_meta(data.node);
        let str = "";
        for (let [key, val] of Object.entries(node_data)) {
          str += key + ':\'' + val.toString() + '\', ';
        }
        str = "{ " + str.slice(0, str.length - 2) + ' }';

        this.cypher(`MATCH (n) WHERE id(n) = ${_id} SET n = ${str} RETURN n`).then((r) => {
          resolve(r);
        })
      }
      else if (name === "set_edge_data") {
        const _id = this.remote_edge_ids[data.edge.id()];
        let str = "";
        for (let [key, val] of Object.entries(data.data)) {
          str += key + ':\'' + val.toString() + '\', ';
        }
        str = "{ " + str.slice(0, str.length - 2) + ' }';

        this.cypher(`MATCH ()-[n]->() WHERE id(n) = ${_id} SET n = ${str} RETURN n`).then((r) => {
          resolve(r);
        })
      }
      else if (name === "create_node") {
        this.cypher(`CREATE (n:${data.label}) RETURN n`).then((result) => {
          if (result.length === 0) {
            message.error('Can\'t create node!');
            return
          }
          const node = result[0].get('n');
          this.remote_ids[data.local_id] = node.elementId;
          resolve(result);
        });
      }
      else if (name === "create_edge") {
        const start = this.remote_ids[data.start];
        const end = this.remote_ids[data.end];
        console.log('start', data.start + ' ' + this.remote_ids[data.start]);
        if (start === undefined) {
          return;
        }
        this.cypher(`MATCH (p) WHERE id(p) = ${start} MATCH (l) WHERE id(l) = ${end} MERGE (p)-[r:${data.label}]->(l) RETURN *`).then((result) => {
          if (result.length === 0) {
            message.error('Can\'t create edge!');
            return;
          }
          const edge = result[0].get('r');
          this.remote_edge_ids[data.local_id] = edge.elementId;
          resolve(result);
        });
      }
      else if (name === "remove_node") {
        const _id = this.remote_ids[data.id];
        delete this.remote_ids[data.id];
        this.cypher(`MATCH (n) WHERE id(n) = ${_id} DETACH DELETE n`).then((r) => {
          resolve(r);
        })
      }
      else if (name === "remove_edge") {
        const _id = this.remote_edge_ids[data.id];
        delete this.remote_edge_ids[data.id];
        this.cypher(`MATCH ()-[b]->() WHERE id(b) = ${_id} DELETE b`).then((r) => {
          resolve(r);
        })
      }
      else if (name === "rename_edge") {
        this.request('remove_edge', {
          id: data.edge.id(),
        }).then(() => {
          this.request('create_edge', {
            start: data.edge.source().id(),
            end: data.edge.target().id(),
            label: data.edge.data().label,
            local_id: data.edge.id(),
          }).then(() => {
            this.request('set_edge_data', {
              edge: data.edge,
              data: data.edge.data().data,
            });
          });
        });
      }
      else if (name === "rename_node") {
        const _id = this.remote_ids[data.node.id()];
        this.cypher(`MATCH (n) WHERE id(n) = ${_id} REMOVE n:${data.old_name} SET n:${data.new_name}`).then((r) => {
          resolve(r);
        });
      }
    }
  }

  run = () => {
    this.counter = document.getElementById('requests_count');
    setInterval(() => {
      this.processRequest();
    }, 100);
  }
};

window.addEventListener("error", (event) => {
  console.log(';ERROR!')
  message.error(`${event.type}: ${event.message}`);
});

export const api = new API();
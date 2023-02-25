export class KBNode {
  constructor(label, data, x, y) {
    this.id = next_id++;
    this.label = label;
    this.data = data;
    this.x = x;
    this.y = y;
  }
};


export class KBEdge {
  constructor(label, data, start, end) {
    this.id = next_id++;
    this.label = label;
    this.data = data;
    this.start = start;
    this.end = end;
  }
};

var next_id = 0;

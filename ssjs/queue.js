module.exports = Queue;

function Queue() {
    this.first = null;
    this.last = null;
    this.size = 0;
    this.next_node_id = 1;
    this.locked = false;
    this.lock_num = 0;
    this.lock_next_num = 1;
};

function QNode(data, id) {
    this.data = data;
    this.next = null;
    this.prev = null;
    this.opu = -1;
    this.in_process = false;
    this.id = id;
};

Queue.prototype.enqueue = function(data) {
    var node = new QNode(data, this.next_node_id++);
    var n = this.last;

    if (!this.first){
        this.first = node;
        this.last = node;
	node.prev = null;
	node.next = null;
    } else {
        n.next = node;
        node.prev = this.last;
        node.next = null;
        this.last = node;
    }

    this.size += 1;
    return node;
};

Queue.prototype.dequeue = function(node) {
    if (!node || node == undefined) return false;
    
    if (node.next) node.next.prev = (node.prev)?node.prev:null;
    else this.last = (node.prev)?node.prev:null;
    
    if (node.prev) node.prev.next = (node.next)?node.next:null;
    else this.first = (node.next)?node.next:null;

    delete node;
    this.size -= 1;
    return true;
};

Queue.prototype.get_first = function() {

    return this.first;
}

Queue.prototype.get_next = function(node) {

    return node.next;
}

Queue.prototype.get_last = function() {

    return this.last;
}

Queue.prototype.get_prev = function(node) {

    return node.prev;
}

Queue.prototype.seek = function(id) {

    var n = this.get_first();
    while (n) {
	if (n.id == id) return n;
	n = n.next;
    }
    return null;
}

Queue.prototype.seekTask = function(tNum) {

    var n = this.get_first();
    while (n) {
	if (n.data.taskNum == tNum) return n;
	n = n.next;
    }
    return null;
}


Queue.prototype.lock = function() {

    var me = this;
    if (this.locked && this.lock_num != this.lock_next_num) {
//	setTimeout(me.lock, 0);
	return 0;
    }

    if (this.locked && this.lock_num == this.lock_next_num) {
	return this.lock_next_num;
    }

    this.locked = true;
    this.lock_next_num++;
    return ++this.lock_num;
}

Queue.prototype.unlock = function(num) {

    var me = this;
    
    if (this.locked && this.lock_num == num) {
	this.locked = false;
	setTimeout(me.unlock, 0, num);
	return true;
    }

    if (this.locked) {
	setTimeout(me.get_first, 0);
	return false;
    }
    
    return true;
}

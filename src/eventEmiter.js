export function EventEmiter(){
    this._listener= []
}

EventEmiter.prototype.add = function(cb) {
    if(this._listener && this._listener.find(f => f === cb)) return
    if(!this._listener) this._listener = []

    this._listener.push(cb)
    console.log('emiter添加回调：', this._listener.length)
}

EventEmiter.prototype.remove = function(cb){
    if(!cb) return
    this._listener = this._listener.filter(f => f !== cb)
    console.log('emiter移除回调：', this._listener.length)
}

EventEmiter.prototype.size = function() {
    return this._listener.length
}

EventEmiter.prototype.clear = function(){
    this._listener = null
}

EventEmiter.prototype.emit = function(...arg){
    (this._listener || []).forEach(fn => fn(...arg))
}
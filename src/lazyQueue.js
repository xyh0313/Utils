export class LazyQueue {
    list
    pending
    interval
    callback

    /**
     *
     * @param {Function} cb 回调方法
     * @param {Number} interval 延迟时间
     */
    constructor(cb, interval){
        this.callback = cb
        this.list = []
        this.pending = false
        this.interval = interval
    }

    setInterval(interval) {
        this.interval = interval
    }

    execute = () => { setTimeout(() => this.flushTasks(), this.interval) }

    flushTasks () {
        if(!this.callback) throw new Error("Please set callback funciton.")

        this.pending = false
        const copies = this.list.slice(0)
        this.list.length = 0
        this.callback(copies)
    }

    queue (data) {
        if(!data) return
        this.list.push(data)
        if (!this.pending) {
            this.pending = true
            this.execute()
        }
    }
}


/**
    let task = new LazyQueue(list => {
        console.log(list)
    }, 2000)

    task.queue("1111111111111")
    task.queue("2222222222222")
    task.queue("2222222222222")
    task.queue("2222222222222")
    task.queue("2222222222222")

    setTimeout(() => {
        task.queue("5555555555555")
        task.queue("6666666666666")
    }, 3000)

 */

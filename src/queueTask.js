/**
 * 通用异步任务队列
 */

export class QueueTask {
  callbacks
  pending
  interval

  constructor(interval = 0){
    this.callbacks = []
    this.pending = false
    this.interval = interval
  }

  setInterval(interval) {
    this.interval = interval
  }

  execute = () => { setTimeout(() => this.flushTasks(), this.interval) }

  flushTasks () {
    this.pending = false
    const copies = this.callbacks.slice(0)
    this.callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }

  /**
   * 异步执行队列，主程序执行完后执行此异步队列
   * @param {Function} cb 要加入异步执行的方法
   * @param {Object} ctx 方法执行的上下文，没有可忽略此参数
  */
  queueTask (cb, ctx = null) {
    let _resolve
    this.callbacks.push(() => {
      if (cb) {
          cb.call(ctx)
      } else if (_resolve) {
        _resolve(ctx)
      }
    })
    if (!this.pending) {
      this.pending = true
      this.execute()
    }

    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(resolve => {
        _resolve = resolve
      })
    }
  }
}

/**

function test1(){ console.log('test1'); }
function test2(){ console.log('test2'); }
function test3(){ console.log('test3'); }
function test4(){ console.log('test4'); }

let task = new QueueTask(500)
task.queueTask(test1)
task.queueTask(test2)
task.queueTask(test3)
task.queueTask(test4)

*/

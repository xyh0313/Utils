import { QueueTask } from './queueTask'

/**
 * 消息队列
 * @param {Boolean} isAsync 是否异步订阅
 */
export function SubjectService(isAsync = false){
    this.channel = { }
    this.isAsync = isAsync || false
    if(this.isAsync){
        this.tasks = new QueueTask()
    }
}

SubjectService.prototype.subscribe = function(topic, ...handlers) {
    if(!handlers || handlers.length === 0) return

    if(!this.channel) this.channel = []
    if(!this.channel[topic]) this.channel[topic] = []

    this.channel[topic].push(...handlers)
}

SubjectService.prototype.publish = function(topic, ...data){
    const channelTopic = this.channel[topic]
    if(!channelTopic || channelTopic.length === 0) return null

    if(this.isAsync && this.tasks) {
        channelTopic.forEach(handler => {
            this.tasks.queueTask(() => {
                handler.apply(0[0], data)
            })
        })
    }
    else {
        channelTopic.forEach(handler => {
            handler.apply(0[0], data)
        })
    }
}

SubjectService.prototype.unsubscribe = function(topic, handler = null){
    const channelTopic = this.channel[topic]
    if(!channelTopic || channelTopic.length === 0) return false
    if(!handler) {
        this.channel[topic].length = 0
        delete this.channel[topic]
        return true
    }

    const index = channelTopic.indexOf(handler)
    if(index < 0) return false

    this.channel[topic] =  this.channel[topic].filter(f => f !== handler)
    if(this.channel[topic].length === 0) {
        delete this.channel[topic]
    }

    return true
}

SubjectService.prototype.clear = function(){
    this.channel = { }
}

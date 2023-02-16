/*
 * @Descripttion: 时间分片任务队列
 * @Author: xinyanhui@haier.com
 * @Date: 2022-06-18 09:40:28
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-02-16 18:16:34
 */
const TIMER_CONST = {
    SLICE: 400,
    INTERVAL: 600
}

export class TimeSliceQueue {
    interval
    timeoutHandler
    list
    timeSlice
    callback
    pending

    /**
     *
     * @param {Function} cb 回调方法
     * @param {Number} timeSlice 时间片
     * @param {Number} interval 间隔时间
     */
    constructor(cb, timeSlice = TIMER_CONST.SLICE, interval = TIMER_CONST.INTERVAL) {
        this.callback = cb;
        this.list = [];
        this.pending = false;
        this.interval = interval;
        this.timeSlice = timeSlice;
    }

    execute = () => { 
        console.log(`【属性上报时间分片】启动定时任务！${this.interval},${this.timeSlice}`)
        this.timeoutHandler = setTimeout(() => {
            this.flushTasks();
        }, this.interval)
    }

    flushTasks() {
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
            this.timeoutHandler = null;
        }

        if (!this.callback || typeof(this.callback) != "function") {
            throw new Error("Please set callback funciton.");
        }
        
        console.log(`【属性上报】分片开始！`)
        let startTime = Date.now();
        do { 
            const val = this.list.shift();
            console.log(`【属性上报】 开始 ${val.devId}`)
            val && this.callback(val);
            console.log(`【属性上报】 结束 ${val.devId}`)

        } while (Date.now() - startTime <= this.timeSlice && this.list.length > 0);
        
        this.pending = false;
        console.log(`【属性上报】分片结束！`)

        if (!this.list.length) {
            if (this.timeoutHandler) {
                clearTimeout(this.timeoutHandler);
                this.timeoutHandler = null;
            }
            console.log(`【属性上报时间分片】队列全部执行完成！`)
            return;
        }
       
        this.execute();
    }

    queue(data) {
        if (!data) return;

        if (Array.isArray(data)) {
            this.list.push(...data);
        } else {
            this.list.push(data);
        }
        if (!this.pending) {
            this.pending = true;
            this.execute();
        } 
    }

    destroy() {
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler);
            this.timeoutHandler = null;
        }

        this.list = [];
        this.pending = false;
        this.interval = 0;
        this.callback = null;
    }
}



// test
// var task = new TimeSliceQueue((val)=> {
//     console.info(val)
// })

// for (let i=0; i<100000; i++) {
//     task.queue(i)
// }